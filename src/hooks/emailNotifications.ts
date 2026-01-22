import type { CollectionAfterChangeHook } from 'payload'
import { emailService } from '../utilities/emailService'

export const notifyAdminOnNewComment: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  try {
    await emailService.initialize(req.payload)

    // Get the post title
    let postTitle = 'Unknown Post'
    if (doc.post) {
      const postId = typeof doc.post === 'object' ? doc.post.id : doc.post
      const post = await req.payload.findByID({
        collection: 'posts',
        id: postId,
        depth: 0,
      })
      postTitle = post?.title || 'Unknown Post'
    }

    // Get admin users
    const admins = await req.payload.find({
      collection: 'users',
      where: {
        roles: { contains: 'admin' },
      },
      depth: 0,
    })

    const adminEmails = admins.docs.map((admin) => admin.email).filter(Boolean) as string[]

    if (adminEmails.length > 0) {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

      await emailService.send({
        to: adminEmails,
        subject: `New Comment on "${postTitle}"`,
        html: `
          <h2>New Comment Pending Approval</h2>
          <p><strong>Post:</strong> ${postTitle}</p>
          <p><strong>Author:</strong> ${doc.author?.name || 'Anonymous'}</p>
          <p><strong>Email:</strong> ${doc.author?.email || 'N/A'}</p>
          <p><strong>Comment:</strong></p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">
            ${doc.content}
          </blockquote>
          <p><a href="${serverUrl}/admin/collections/comments/${doc.id}">Review Comment</a></p>
        `,
      })
    }
  } catch (error) {
    console.error('Failed to send new comment notification:', error)
  }

  return doc
}

export const notifyOnCommentApproved: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') return doc
  if (previousDoc?.status === 'approved' || doc.status !== 'approved') return doc

  try {
    await emailService.initialize(req.payload)

    const commenterEmail = doc.author?.email
    if (!commenterEmail) return doc

    // Get the post
    let postTitle = 'Unknown Post'
    let postUrl = ''
    if (doc.post) {
      const postId = typeof doc.post === 'object' ? doc.post.id : doc.post
      const post = await req.payload.findByID({
        collection: 'posts',
        id: postId,
        depth: 0,
      })
      postTitle = post?.title || 'Unknown Post'
      postUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/posts/${post?.slug}`
    }

    await emailService.send({
      to: commenterEmail,
      subject: `Your comment on "${postTitle}" has been approved`,
      html: `
        <h2>Your Comment Has Been Approved!</h2>
        <p>Hi ${doc.author?.name || 'there'},</p>
        <p>Your comment on "<a href="${postUrl}">${postTitle}</a>" has been approved and is now visible.</p>
        <p><strong>Your comment:</strong></p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">
          ${doc.content}
        </blockquote>
        <p><a href="${postUrl}#comments">View your comment</a></p>
      `,
    })
  } catch (error) {
    console.error('Failed to send comment approved notification:', error)
  }

  return doc
}

export const notifyOnCommentReply: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  if (!doc.parentComment) return doc

  try {
    await emailService.initialize(req.payload)

    // Get parent comment
    const parentId =
      typeof doc.parentComment === 'object' ? doc.parentComment.id : doc.parentComment
    const parentComment = await req.payload.findByID({
      collection: 'comments',
      id: parentId,
      depth: 0,
    })

    if (!parentComment?.subscribedToReplies || !parentComment?.author?.email) {
      return doc
    }

    // Get the post
    let postTitle = 'Unknown Post'
    let postUrl = ''
    if (doc.post) {
      const postId = typeof doc.post === 'object' ? doc.post.id : doc.post
      const post = await req.payload.findByID({
        collection: 'posts',
        id: postId,
        depth: 0,
      })
      postTitle = post?.title || 'Unknown Post'
      postUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/posts/${post?.slug}`
    }

    await emailService.send({
      to: parentComment.author.email,
      subject: `New reply to your comment on "${postTitle}"`,
      html: `
        <h2>Someone Replied to Your Comment!</h2>
        <p>Hi ${parentComment.author?.name || 'there'},</p>
        <p>${doc.author?.name || 'Someone'} replied to your comment on "<a href="${postUrl}">${postTitle}</a>":</p>
        <p><strong>Your original comment:</strong></p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">
          ${parentComment.content}
        </blockquote>
        <p><strong>Their reply:</strong></p>
        <blockquote style="border-left: 3px solid #28a745; padding-left: 10px; margin-left: 0;">
          ${doc.content}
        </blockquote>
        <p><a href="${postUrl}#comments">View the conversation</a></p>
      `,
    })
  } catch (error) {
    console.error('Failed to send comment reply notification:', error)
  }

  return doc
}

export const notifySubscribersOnNewPost: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  // Only notify when post is published AND notification hasn't been sent yet
  const wasPublished = previousDoc?._status !== 'published' && doc._status === 'published'
  const alreadyNotified = doc.notificationSent === true

  if (!wasPublished || alreadyNotified) return doc

  try {
    await emailService.initialize(req.payload)

    // Get active subscribers who want new post notifications
    const subscribers = await req.payload.find({
      collection: 'subscribers',
      where: {
        and: [{ status: { equals: 'active' } }, { 'preferences.newPosts': { equals: true } }],
      },
      limit: 1000,
      depth: 0,
    })

    if (subscribers.docs.length === 0) {
      // Mark as sent even if no subscribers (to prevent future attempts)
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { notificationSent: true },
        req,
      })
      return doc
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const postUrl = `${serverUrl}/posts/${doc.slug}`

    // Send emails in batches
    const batchSize = 50
    for (let i = 0; i < subscribers.docs.length; i += batchSize) {
      const batch = subscribers.docs.slice(i, i + batchSize)

      await Promise.all(
        batch.map((subscriber) => {
          const unsubscribeUrl = `${serverUrl}/unsubscribe?token=${subscriber.unsubscribeToken}`

          return emailService.send({
            to: subscriber.email,
            subject: `New Post: ${doc.title}`,
            html: `
              <h2>${doc.title}</h2>
              <p>${doc.excerpt || ''}</p>
              <p><a href="${postUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Read More</a></p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                You received this email because you subscribed to our newsletter.
                <a href="${unsubscribeUrl}">Unsubscribe</a>
              </p>
            `,
          })
        }),
      )
    }

    // Mark notification as sent
    await req.payload.update({
      collection: 'posts',
      id: doc.id,
      data: { notificationSent: true },
      req,
    })

    console.log(`Notified ${subscribers.docs.length} subscribers about new post: ${doc.title}`)
  } catch (error) {
    console.error('Failed to send new post notifications:', error)
  }

  return doc
}

export const sendSubscriberConfirmation: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'create') return doc

  // Skip confirmation email if created via magic link (already sends its own email)
  if (context?.skipConfirmationEmail) return doc

  try {
    await emailService.initialize(req.payload)

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const confirmUrl = `${serverUrl}/confirm-subscription?token=${doc.confirmationToken}`
    const unsubscribeUrl = `${serverUrl}/unsubscribe?token=${doc.unsubscribeToken}`

    await emailService.send({
      to: doc.email,
      subject: 'Confirm your subscription',
      html: `
        <h2>Confirm Your Subscription</h2>
        <p>Hi${doc.name ? ` ${doc.name}` : ''},</p>
        <p>Thank you for subscribing to our newsletter! Please confirm your subscription by clicking the button below:</p>
        <p>
          <a href="${confirmUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirm Subscription
          </a>
        </p>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          If you didn't subscribe, you can safely ignore this email or 
          <a href="${unsubscribeUrl}">unsubscribe here</a>.
        </p>
      `,
    })
  } catch (error) {
    console.error('Failed to send subscription confirmation:', error)
  }

  return doc
}
