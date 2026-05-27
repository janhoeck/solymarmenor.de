'use server'

import { db } from '@/utils/db'
import { guestbook } from '@/utils/db/schema'
import { revalidatePath } from 'next/cache'

import { FormState, GuestbookEntry, GuestbookFormData, schema } from './types'

export async function insertGuestbookEntry(_prevState: FormState, formData: FormData): Promise<FormState> {
  const guestbookFormData = Object.fromEntries([...formData]) as unknown as GuestbookFormData
  guestbookFormData.rating = Number(guestbookFormData.rating)

  const { success, error: zodError } = schema.safeParse(guestbookFormData)
  if (!success) {
    return {
      entry: null,
      errors: zodError.flatten().fieldErrors,
      success: false,
    }
  }

  try {
    const [data] = await db
      .insert(guestbook)
      .values({
        name: guestbookFormData.name,
        message: guestbookFormData.message,
        rating: Number(guestbookFormData.rating),
      })
      .returning({ id: guestbook.id })

    if (!data) {
      return {
        entry: null,
        success: false,
        errors: null,
      }
    }

    revalidatePath('/guestbook')
    return {
      entry: data as GuestbookEntry,
      success: true,
      errors: null,
    }
  } catch {
    return {
      entry: null,
      success: false,
      errors: null,
    }
  }
}
