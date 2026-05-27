'use client'

import { ContentContainer } from '@/components/shared/Container/ContentContainer'
import { GuestbookForm } from '@/components/shared/GuestbookForm/GuestbookForm'
import { Section } from '@/components/shared/Section/Section'
import { P } from '@jan_hoeck/ui'
import { useTranslations } from 'next-intl'

export const EmptyGuestbookView = () => {
  const t = useTranslations('pages.guestbook')

  return (
    <ContentContainer className='mt-10'>
      <Section title={t('headline')}>
        <div className='flex max-w-[550px] flex-col gap-6'>
          <Section
            title={t('empty.headline')}
            variant='subsection'
          >
            <P>{t('empty.text')}</P>
          </Section>
          <GuestbookForm />
        </div>
      </Section>
    </ContentContainer>
  )
}
