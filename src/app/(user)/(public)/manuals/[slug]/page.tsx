import { client } from '@/sanity/lib/client'
import { validateSlug } from '@/utils/format'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import ManualDetailClient from './ManualDetailClient'

async function showManualDetail(slug: string) {
  const query = groq`*[_type == "manual" && slug.current == $slug && status == "published"][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    status,
    "image": image.asset->url,
    "category": category->title,
    fileType,
    fileUrl,
    uploaderName,
    _updatedAt
  }`
  return await client.fetch(query, { slug })
}

export default async function ManualPage({ params }: { params: Promise<{ slug: string }> }) {
  const decodedSlug = validateSlug((await params).slug)
  const manual = await showManualDetail(decodedSlug)

  if (!manual) return notFound()

  return <ManualDetailClient manual={manual} />
}
