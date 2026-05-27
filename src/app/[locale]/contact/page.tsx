'use client'

import { ContactDetails } from '@/components/shared/ContactDetails/ContactDetails'
import { ContactForm } from '@/components/shared/ContactForm/ContactForm'
import { ContentContainer } from '@/components/shared/Container/ContentContainer'
import { Section } from '@/components/shared/Section/Section'
import { useTranslations } from 'next-intl'

export default function ContactPage() {
  const t = useTranslations('pages.contact')

  return (
    <ContentContainer className='mt-10'>
      <div className='flex flex-col gap-6'>
        <Section title={t('contact.headline')}>
          <ContactDetails />
        </Section>
        <Section title={t('enquiry.headline')}>
          <div className='flex max-w-[550px] flex-col gap-4'>
            <ContactForm />
          </div>
        </Section>
      </div>
    </ContentContainer>
  )
}
