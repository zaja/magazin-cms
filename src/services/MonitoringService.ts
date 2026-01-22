/**
 * Monitoring Service for RSS Auto-Poster
 * Provides health checks and statistics
 */

import type { Payload } from 'payload'
import { ClaudeTranslator } from './ClaudeTranslator'

export interface HealthStatus {
  healthy: boolean
  checks: {
    payloadConnected: boolean
    claudeApiAvailable: boolean
    pendingQueueSize: number
    failureRate24h: number
  }
  issues: string[]
}

export interface Statistics {
  totalImports: number
  successfulImports: number
  failedImports: number
  pendingImports: number
  claudeTokensUsed: number
  estimatedCost: number
  averageProcessingTime: number
  topFeeds: Array<{ name: string; imports: number }>
}

// Claude API pricing (approximate, as of 2024)
const CLAUDE_INPUT_TOKEN_COST = 0.003 / 1000 // $3 per million tokens
const CLAUDE_OUTPUT_TOKEN_COST = 0.015 / 1000 // $15 per million tokens

export class MonitoringService {
  private payload: Payload

  constructor(payload: Payload) {
    this.payload = payload
  }

  /**
   * Gets overall system health status
   *
   * @returns Health status with individual checks
   */
  async getSystemHealth(): Promise<HealthStatus> {
    const issues: string[] = []
    const checks = {
      payloadConnected: false,
      claudeApiAvailable: false,
      pendingQueueSize: 0,
      failureRate24h: 0,
    }

    // Check Payload connection
    try {
      await this.payload.find({
        collection: 'users',
        limit: 1,
      })
      checks.payloadConnected = true
    } catch (error) {
      issues.push(`Payload connection failed: ${error}`)
    }

    // Check Claude API (only if key is configured)
    if (process.env.CLAUDE_API_KEY) {
      try {
        const translator = new ClaudeTranslator()
        checks.claudeApiAvailable = await translator.testConnection()
        if (!checks.claudeApiAvailable) {
          issues.push('Claude API connection test failed')
        }
      } catch (error) {
        issues.push(`Claude API error: ${error}`)
      }
    } else {
      issues.push('CLAUDE_API_KEY not configured')
    }

    // Check pending queue size
    try {
      const pending = await this.payload.count({
        collection: 'imported-posts' as 'posts',
        where: {
          status: { equals: 'pending' },
        },
      })
      checks.pendingQueueSize = pending.totalDocs

      if (pending.totalDocs > 50) {
        issues.push(`High pending queue: ${pending.totalDocs} items`)
      }
    } catch (error) {
      issues.push(`Failed to check pending queue: ${error}`)
    }

    // Calculate failure rate
    try {
      checks.failureRate24h = await this.getFailureRate(24)
      if (checks.failureRate24h > 20) {
        issues.push(`High failure rate: ${checks.failureRate24h.toFixed(1)}%`)
      }
    } catch (error) {
      issues.push(`Failed to calculate failure rate: ${error}`)
    }

    return {
      healthy: issues.length === 0,
      checks,
      issues,
    }
  }

  /**
   * Calculates failure rate for the specified time period
   *
   * @param hours - Number of hours to look back
   * @returns Failure rate as percentage
   */
  async getFailureRate(hours = 24): Promise<number> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)

    const [completed, failed] = await Promise.all([
      this.payload.count({
        collection: 'imported-posts' as 'posts',
        where: {
          and: [{ status: { equals: 'completed' } }, { processedAt: { greater_than: cutoff } }],
        },
      }),
      this.payload.count({
        collection: 'imported-posts' as 'posts',
        where: {
          and: [{ status: { equals: 'failed' } }, { processedAt: { greater_than: cutoff } }],
        },
      }),
    ])

    const total = completed.totalDocs + failed.totalDocs
    if (total === 0) return 0

    return (failed.totalDocs / total) * 100
  }

  /**
   * Gets statistics for a time period
   *
   * @param period - Time period (today, week, month)
   * @returns Statistics object
   */
  async getStatistics(period: 'today' | 'week' | 'month' = 'today'): Promise<Statistics> {
    const cutoff = this.getPeriodCutoff(period)

    // Get counts by status
    const [completed, failed, pending] = await Promise.all([
      this.payload.find({
        collection: 'imported-posts' as 'posts',
        where: {
          and: [{ status: { equals: 'completed' } }, { processedAt: { greater_than: cutoff } }],
        },
        limit: 1000,
      }),
      this.payload.count({
        collection: 'imported-posts' as 'posts',
        where: {
          and: [{ status: { equals: 'failed' } }, { processedAt: { greater_than: cutoff } }],
        },
      }),
      this.payload.count({
        collection: 'imported-posts' as 'posts',
        where: {
          status: { equals: 'pending' },
        },
      }),
    ])

    // Calculate token usage
    let claudeTokensUsed = 0
    for (const doc of completed.docs) {
      const record = doc as unknown as Record<string, unknown>
      claudeTokensUsed += (record.translationTokens as number) || 0
    }

    // Estimate cost (rough approximation - assumes 50% input, 50% output)
    const estimatedCost =
      claudeTokensUsed * 0.5 * CLAUDE_INPUT_TOKEN_COST +
      claudeTokensUsed * 0.5 * CLAUDE_OUTPUT_TOKEN_COST

    // Get top feeds
    const topFeeds = await this.getTopFeeds(period)

    return {
      totalImports: completed.docs.length + failed.totalDocs,
      successfulImports: completed.docs.length,
      failedImports: failed.totalDocs,
      pendingImports: pending.totalDocs,
      claudeTokensUsed,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      averageProcessingTime: 0, // Would need additional tracking
      topFeeds,
    }
  }

  /**
   * Gets the top performing feeds by import count
   */
  private async getTopFeeds(
    period: 'today' | 'week' | 'month',
  ): Promise<Array<{ name: string; imports: number }>> {
    const cutoff = this.getPeriodCutoff(period)

    // Get all feeds
    const feeds = await this.payload.find({
      collection: 'rss-feeds' as 'posts',
      limit: 100,
    })

    const feedCounts: Map<string, { name: string; imports: number }> = new Map()

    for (const feed of feeds.docs) {
      const feedRecord = feed as unknown as Record<string, unknown>
      const feedId = String(feed.id)
      const feedName = (feedRecord.name as string) || 'Unknown'

      const imports = await this.payload.count({
        collection: 'imported-posts' as 'posts',
        where: {
          and: [
            { rssFeed: { equals: feedId } },
            { status: { equals: 'completed' } },
            { processedAt: { greater_than: cutoff } },
          ],
        },
      })

      if (imports.totalDocs > 0) {
        feedCounts.set(feedId, { name: feedName, imports: imports.totalDocs })
      }
    }

    // Sort and return top 10
    return Array.from(feedCounts.values())
      .sort((a, b) => b.imports - a.imports)
      .slice(0, 10)
  }

  /**
   * Gets cutoff date for a period
   */
  private getPeriodCutoff(period: 'today' | 'week' | 'month'): Date {
    const now = new Date()

    switch (period) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0))
      case 'week':
        return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Runs health checks and logs warnings
   */
  async checkAndAlert(): Promise<void> {
    console.log('[MonitoringService] Running health checks...')

    const health = await this.getSystemHealth()

    if (!health.healthy) {
      console.warn('[MonitoringService] System health issues detected:')
      health.issues.forEach((issue) => console.warn(`  - ${issue}`))
    } else {
      console.log('[MonitoringService] All health checks passed')
    }

    // Log queue status
    console.log(`[MonitoringService] Pending queue size: ${health.checks.pendingQueueSize}`)
    console.log(`[MonitoringService] 24h failure rate: ${health.checks.failureRate24h.toFixed(1)}%`)
  }
}
