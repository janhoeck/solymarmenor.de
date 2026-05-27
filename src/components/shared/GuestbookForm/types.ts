import { z } from 'zod'

export type GuestbookFormData = {
  name: string
  rating: number
  message: string
}

export type GuestbookEntry = GuestbookFormData & { id: number; created_at: string }

export const schema = z.object({
  name: z.string().min(1),
  message: z.string().min(1),
  rating: z.number().min(1).max(5),
})

export type FormState =
  | {
      entry: GuestbookEntry
      errors: null
      success: true
    }
  | {
      entry: null
      errors: null | Partial<Record<keyof z.infer<typeof schema>, string[]>>
      success: false
    }
