'use client'

import { ContentContainer } from '@/components/shared/Container/ContentContainer'
import { GuestbookForm } from '@/components/shared/GuestbookForm/GuestbookForm'
import { Section } from '@/components/shared/Section/Section'
import { useTranslations } from 'next-intl'

import { GuestbookEntry } from '../shared/GuestbookForm/types'
import { GuestbookCard } from './card/GuestbookCard'

type GuestbookViewProps = {
  entries: GuestbookEntry[]
}

export const GuestbookView = (props: GuestbookViewProps) => {
  const { entries } = props
  const t = useTranslations('pages.guestbook')

  return (
    <ContentContainer className='mt-10'>
      <Section title={t('headline')}>
        <div className='flex flex-col gap-6'>
          <Section
            title={t('descriptions.1/headline')}
            variant='subsection'
          >
            <div className='flex max-w-[550px] flex-col gap-4'>
              <span className='text-foreground'>{t('descriptions.1')}</span>
              <GuestbookForm />
            </div>
          </Section>
          <Section
            title={t('descriptions.2/headline')}
            variant='subsection'
          >
            <div className='flex flex-col gap-6'>
              {entries.map((guestbookEntry) => (
                <GuestbookCard
                  id={guestbookEntry.id}
                  key={guestbookEntry.id}
                  name={guestbookEntry.name}
                  message={guestbookEntry.message}
                  createdAt={guestbookEntry.created_at}
                  rating={guestbookEntry.rating}
                />
              ))}
            </div>
          </Section>
        </div>
      </Section>
    </ContentContainer>
  )
}
