'use server'

import { EmptyGuestbookView } from '@/components/guestbook/EmptyGuestbookView'
import { GuestbookView } from '@/components/guestbook/GuestbookView'
import { GuestbookEntry } from '@/components/shared/GuestbookForm/types'
import { db } from '@/utils/db'
import { guestbook } from '@/utils/db/schema'
import { desc } from 'drizzle-orm'

export default async function GuestbookPage() {
  const data = await db.select().from(guestbook).orderBy(desc(guestbook.created_at))

  if (data.length === 0) {
    return <EmptyGuestbookView />
  }

  return (
    <GuestbookView
      entries={data.map((entry) => ({
        ...entry,
        created_at: entry.created_at.toISOString(),
      })) as GuestbookEntry[]}
    />
  )
}
