import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function resetImports() {
  const payload = await getPayload({ config })

  // Reset completed imports back to pending
  const completed = await payload.find({
    collection: 'imported-posts',
    where: { status: { equals: 'completed' } },
    limit: 10,
  })

  console.log('Found', completed.docs.length, 'completed imports')

  for (const doc of completed.docs) {
    await payload.update({
      collection: 'imported-posts',
      id: doc.id,
      data: { status: 'pending', post: null },
    })
    console.log('Reset import', doc.id)
  }

  // Delete posts 5 and 6 that were created with bad content
  for (const postId of [5, 6]) {
    try {
      await payload.delete({
        collection: 'posts',
        id: postId,
      })
      console.log('Deleted post', postId)
    } catch (e) {
      console.log('Post', postId, 'not found or already deleted')
    }
  }

  console.log('Done!')
  process.exit(0)
}

resetImports().catch(console.error)
