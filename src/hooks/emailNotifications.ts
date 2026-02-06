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
      const adminUrl = `${serverUrl}/admin/collections/comments/${doc.id}`

      const variables = {
        postTitle,
        authorName: doc.author?.name || 'Anonymous',
        commentContent: doc.content || '',
        adminUrl,
      }

      const template = await emailService.getTemplate('newCommentAdmin', variables)

      await emailService.send({
        to: adminEmails,
        subject: template?.subject || `Novi komentar na post: ${postTitle}`,
        html:
          template?.html ||
          `
          <p>Korisnik <strong>${variables.authorName}</strong> je ostavio novi komentar na post "${postTitle}":</p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 10px;">${doc.content}</blockquote>
          <p>Pregledaj komentar: <a href="${adminUrl}">${adminUrl}</a></p>
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

    const variables = {
      authorName: doc.author?.name || 'there',
      postTitle,
      postUrl,
    }

    const template = await emailService.getTemplate('commentApproved', variables)

    await emailService.send({
      to: commenterEmail,
      subject: template?.subject || 'Vaš komentar je odobren!',
      html:
        template?.html ||
        `
        <p>Pozdrav ${variables.authorName},</p>
        <p>Vaš komentar na post "${postTitle}" je odobren i sada je vidljiv svima.</p>
        <p>Pogledajte ga ovdje: <a href="${postUrl}">${postUrl}</a></p>
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

    const variables = {
      authorName: parentComment.author?.name || 'there',
      replyAuthor: doc.author?.name || 'Netko',
      postTitle,
      postUrl,
    }

    const template = await emailService.getTemplate('commentReply', variables)

    await emailService.send({
      to: parentComment.author.email,
      subject: template?.subject || `Novi odgovor na vaš komentar: ${postTitle}`,
      html:
        template?.html ||
        `
        <p>Pozdrav ${variables.authorName},</p>
        <p>${variables.replyAuthor} je odgovorio na vaš komentar na postu "${postTitle}".</p>
        <p>Pogledajte odgovor: <a href="${postUrl}">${postUrl}</a></p>
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
        batch.map(async (subscriber) => {
          const unsubscribeUrl = `${serverUrl}/unsubscribe?token=${subscriber.unsubscribeToken}`

          const variables = {
            postTitle: doc.title || '',
            postExcerpt: doc.excerpt || '',
            postUrl,
            unsubscribeUrl,
          }

          const template = await emailService.getTemplate('newPostSubscriber', variables)

          return emailService.send({
            to: subscriber.email,
            subject: template?.subject || `Novi članak: ${doc.title}`,
            html:
              template?.html ||
              `
              <p>${doc.excerpt || ''}</p>
              <p>Pročitajte cijeli članak: <a href="${postUrl}">${postUrl}</a></p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                Ne želite više primati obavijesti? <a href="${unsubscribeUrl}">Odjavite se</a>
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

    const variables = {
      confirmUrl,
      unsubscribeUrl,
    }

    const template = await emailService.getTemplate('subscribeConfirmation', variables)

    await emailService.send({
      to: doc.email,
      subject: template?.subject || 'Potvrdite pretplatu na newsletter',
      html:
        template?.html ||
        `
        <p>Hvala na pretplati na naš newsletter! Kliknite na link ispod da potvrdite svoju email adresu:</p>
        <p><a href="${confirmUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Potvrdi pretplatu</a></p>
        <p style="font-size: 12px; color: #666;">Ako niste zatražili ovu pretplatu, možete ignorirati ovaj email ili se <a href="${unsubscribeUrl}">odjaviti</a>.</p>
      `,
    })
  } catch (error) {
    console.error('Failed to send subscription confirmation:', error)
  }

  return doc
}
