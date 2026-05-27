'use server'

import { Resend } from 'resend'

import { ContactEmailTemplate } from './ContactMailTemplate'
import { ContactFormData, FormState, schema } from './types'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function sendMail(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const contactFormData = Object.fromEntries([...formData]) as ContactFormData
    contactFormData.message = contactFormData.message.replaceAll(' ', '&nbsp;').replace(/\r\n|\r|\n/g, '<br />')

    const { success } = schema.safeParse(contactFormData)
    if (!success) {
      return {
        success: false,
      }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.NEXT_PUBLIC_CONTACT_MAIL_FROM as string,
      to: [process.env.NEXT_PUBLIC_CONTACT_MAIL_TO as string],
      subject: `Neue Nachricht von ${contactFormData.name}`,
      react: ContactEmailTemplate(contactFormData),
    })

    if (error) {
      return {
        success: false,
      }
    }

    if (data) {
      return {
        success: true,
      }
    }
  } catch (error) {
    return {
      success: false,
    }
  }

  return {
    success: false,
  }
}
