'use server'

import { EmptyGuestbookView } from '@/components/guestbook/EmptyGuestbookView'
import { GuestbookView } from '@/components/guestbook/GuestbookView'
import { GuestbookEntry } from '@/components/shared/GuestbookForm/types'
import { JsonLd } from '@/components/shared/JsonLd/JsonLd'
import { buildGuestbookRatings } from '@/lib/structured-data/reviews'
import { db } from '@/utils/db'
import { guestbook } from '@/utils/db/schema'
import { desc } from 'drizzle-orm'

export default async function GuestbookPage() {
  const data = await db.select().from(guestbook).orderBy(desc(guestbook.created_at))

  if (data.length === 0) {
    return <EmptyGuestbookView />
  }

  const entries = data.map((entry) => ({
    ...entry,
    created_at: entry.created_at.toISOString(),
  })) as GuestbookEntry[]

  const ratings = buildGuestbookRatings(entries)

  return (
    <>
      {ratings && <JsonLd data={ratings} />}
      <GuestbookView entries={entries} />
    </>
  )
}
