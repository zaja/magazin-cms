'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

interface Stats {
  posts: number
  pages: number
  comments: number
  subscribers: number
  pendingComments: number
  mediaCount: number
  mediaSize: number
}

interface PostView {
  id: string
  title: string
  viewCount: number
}

interface RecentActivity {
  id: string
  type: 'post' | 'comment' | 'subscriber'
  title: string
  date: string
  status?: string
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const BeforeDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [topPosts, setTopPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [postsRes, pagesRes, commentsRes, subscribersRes, pendingRes, mediaRes] =
          await Promise.all([
            fetch('/api/posts?limit=0&depth=0'),
            fetch('/api/pages?limit=0&depth=0'),
            fetch('/api/comments?limit=0&depth=0'),
            fetch('/api/subscribers?limit=0&depth=0'),
            fetch('/api/comments?limit=0&depth=0&where[status][equals]=pending'),
            fetch('/api/media?limit=100&depth=0'),
          ])

        const [posts, pages, comments, subscribers, pending, media] = await Promise.all([
          postsRes.json(),
          pagesRes.json(),
          commentsRes.json(),
          subscribersRes.json(),
          pendingRes.json(),
          mediaRes.json(),
        ])

        const totalMediaSize =
          media.docs?.reduce(
            (acc: number, m: { filesize?: number }) => acc + (m.filesize || 0),
            0,
          ) || 0

        setStats({
          posts: posts.totalDocs || 0,
          pages: pages.totalDocs || 0,
          comments: comments.totalDocs || 0,
          subscribers: subscribers.totalDocs || 0,
          pendingComments: pending.totalDocs || 0,
          mediaCount: media.totalDocs || 0,
          mediaSize: totalMediaSize,
        })

        // Fetch recent activity and top viewed posts
        const [recentPostsRes, recentCommentsRes, topViewedRes] = await Promise.all([
          fetch('/api/posts?limit=5&sort=-createdAt&depth=0'),
          fetch('/api/comments?limit=5&sort=-createdAt&depth=0'),
          fetch('/api/posts?limit=5&sort=-viewCount&depth=0'),
        ])

        const [recentPosts, recentComments, topViewed] = await Promise.all([
          recentPostsRes.json(),
          recentCommentsRes.json(),
          topViewedRes.json(),
        ])

        // Set top posts by views
        const topPostsData: PostView[] = (topViewed.docs || [])
          .filter((p: { viewCount?: number }) => (p.viewCount || 0) > 0)
          .map((p: { id: string; title: string; viewCount?: number }) => ({
            id: p.id,
            title: p.title?.length > 30 ? p.title.substring(0, 30) + '...' : p.title,
            viewCount: p.viewCount || 0,
          }))
        setTopPosts(topPostsData)

        const activities: RecentActivity[] = [
          ...(recentPosts.docs || []).map(
            (p: { id: string; title: string; createdAt: string }) => ({
              id: p.id,
              type: 'post' as const,
              title: p.title,
              date: p.createdAt,
            }),
          ),
          ...(recentComments.docs || []).map(
            (c: { id: string; content: string; createdAt: string; status: string }) => ({
              id: c.id,
              type: 'comment' as const,
              title: c.content?.substring(0, 50) + '...',
              date: c.createdAt,
              status: c.status,
            }),
          ),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)

        setRecentActivity(activities)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Calculate max view count for bar chart scaling
  const maxViews = topPosts.length > 0 ? Math.max(...topPosts.map((p) => p.viewCount)) : 0

  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Magazin CMS Dashboard</h4>
      </Banner>

      {/* Aggregated Stats - Compact */}
      <div className={`${baseClass}__stats-compact`}>
        {loading ? (
          <p>Učitavanje...</p>
        ) : stats ? (
          <div className={`${baseClass}__stats-row`}>
            <span>
              <strong>{stats.posts}</strong> Objava
            </span>
            <span className={`${baseClass}__stats-divider`}>|</span>
            <span>
              <strong>{stats.pages}</strong> Stranica
            </span>
            <span className={`${baseClass}__stats-divider`}>|</span>
            <span>
              <strong>{stats.comments}</strong> Komentara
            </span>
            <span className={`${baseClass}__stats-divider`}>|</span>
            <span>
              <strong>{stats.subscribers}</strong> Pretplatnika
            </span>
            <span className={`${baseClass}__stats-divider`}>|</span>
            <span>
              <strong>{stats.mediaCount}</strong> datoteka ({formatBytes(stats.mediaSize)})
            </span>
          </div>
        ) : (
          <p>Greška pri učitavanju statistike</p>
        )}

        {stats && stats.pendingComments > 0 && (
          <Banner type="default" className={`${baseClass}__pending`}>
            <strong>{stats.pendingComments}</strong> komentar(a) čeka odobrenje.{' '}
            <Link href="/admin/collections/comments?where[status][equals]=pending">Pregledaj</Link>
          </Banner>
        )}
      </div>

      {/* Top Posts by Views - Bar Chart */}
      {topPosts.length > 0 && (
        <div className={`${baseClass}__views`}>
          <h5>Najpopularnije objave</h5>
          <div className={`${baseClass}__views-chart`}>
            {topPosts.map((post) => (
              <div key={post.id} className={`${baseClass}__views-row`}>
                <Link
                  href={`/admin/collections/posts/${post.id}`}
                  className={`${baseClass}__views-title`}
                >
                  {post.title}
                </Link>
                <div className={`${baseClass}__views-bar-container`}>
                  <div
                    className={`${baseClass}__views-bar`}
                    style={{ width: `${(post.viewCount / maxViews) * 100}%` }}
                  />
                  <span className={`${baseClass}__views-count`}>{post.viewCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Activity + Quick Actions */}
      <div className={`${baseClass}__two-columns`}>
        {/* Recent Activity */}
        <div className={`${baseClass}__column`}>
          <h5>Nedavna aktivnost</h5>
          {recentActivity.length > 0 ? (
            <ul className={`${baseClass}__activity-list`}>
              {recentActivity.map((activity) => (
                <li
                  key={`${activity.type}-${activity.id}`}
                  className={`${baseClass}__activity-item`}
                >
                  <span
                    className={`${baseClass}__activity-type ${baseClass}__activity-type--${activity.type}`}
                  >
                    {activity.type === 'post' ? '📝' : '💬'}
                  </span>
                  <span className={`${baseClass}__activity-title`}>{activity.title}</span>
                  <span className={`${baseClass}__activity-date`}>
                    {new Date(activity.date).toLocaleDateString('hr-HR')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`${baseClass}__empty`}>Nema nedavne aktivnosti</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`${baseClass}__column`}>
          <h5>Brze akcije</h5>
          <ul className={`${baseClass}__instructions`}>
            <li>
              <Link href="/admin/collections/posts/create">Kreiraj novu objavu</Link>
            </li>
            <li>
              <Link href="/admin/collections/comments?where[status][equals]=pending">
                Moderiraj komentare
              </Link>
            </li>
            <li>
              <Link href="/admin/collections/subscribers">Upravljaj pretplatnicima</Link>
            </li>
            <li>
              <SeedButton />
              {' - demo sadržaj'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BeforeDashboard
