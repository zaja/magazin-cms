import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const redirectPath = searchParams.get('redirect') || '/'

  const draft = await draftMode()
  draft.disable()

  redirect(redirectPath)
}
