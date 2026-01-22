/**
 * Rate limiter for controlling concurrent API requests
 * Implements queue pattern with configurable concurrency and delay
 */

interface QueueItem<T> {
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

export class RateLimiter {
  private queue: QueueItem<unknown>[] = []
  private activeCount = 0
  private maxConcurrent: number
  private minDelay: number
  private lastRunTime = 0

  /**
   * Creates a new RateLimiter instance
   *
   * @param maxConcurrent - Maximum concurrent requests (default: RSS_MAX_CONCURRENT or 2)
   * @param minDelay - Minimum delay between batches in ms (default: RSS_RATE_LIMIT_DELAY_MS or 3000)
   */
  constructor(
    maxConcurrent = parseInt(process.env.RSS_MAX_CONCURRENT || '2', 10),
    minDelay = parseInt(process.env.RSS_RATE_LIMIT_DELAY_MS || '3000', 10),
  ) {
    this.maxConcurrent = maxConcurrent
    this.minDelay = minDelay
  }

  /**
   * Adds a function to the rate-limited queue
   *
   * @param fn - Async function to execute
   * @returns Promise that resolves with the function result
   */
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      })
      this.process()
    })
  }

  /**
   * Processes items in the queue
   */
  private async process(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    // Enforce minimum delay between requests
    const now = Date.now()
    const timeSinceLastRun = now - this.lastRunTime
    if (timeSinceLastRun < this.minDelay && this.lastRunTime > 0) {
      const waitTime = this.minDelay - timeSinceLastRun
      await this.sleep(waitTime)
    }

    const item = this.queue.shift()
    if (!item) return

    this.activeCount++
    this.lastRunTime = Date.now()

    try {
      const result = await item.fn()
      item.resolve(result)
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.activeCount--
      // Process next item in queue
      this.process()
    }
  }

  /**
   * Helper function to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Gets current queue status
   */
  getStatus(): { queueLength: number; activeCount: number } {
    return {
      queueLength: this.queue.length,
      activeCount: this.activeCount,
    }
  }

  /**
   * Clears the queue (pending items will be rejected)
   */
  clear(): void {
    const error = new Error('Queue cleared')
    while (this.queue.length > 0) {
      const item = this.queue.shift()
      if (item) {
        item.reject(error)
      }
    }
  }
}
