import { z } from 'zod'

export type ContactFormData = {
  name: string
  email: string
  phone?: string
  message: string
}

export const schema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  message: z.string().min(1),
})

export type FormState = {
  success: boolean | undefined
}
