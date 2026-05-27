'use client'

import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import deLocale from '@fullcalendar/core/locales/de'
import enLocale from '@fullcalendar/core/locales/en-gb'
import esLocale from '@fullcalendar/core/locales/es'
import dayGridPlugin from '@fullcalendar/daygrid'
import iCalendarPlugin from '@fullcalendar/icalendar'
import FullCalendar from '@fullcalendar/react'
import { Card, CardContent } from '@jan_hoeck/ui'
import { useLocale } from 'next-intl'

import './fullCalendar.css'

export type CalendarCardProps = {
  propertyConfig: PropertyConfiguration
}

export const CalendarCard = (props: CalendarCardProps) => {
  const { propertyConfig } = props
  const locale = useLocale()

  if (!propertyConfig.icalUrl) {
    return null
  }

  const getCalendarLocale = () => {
    switch (locale) {
      case 'de':
        return deLocale
      case 'es':
        return esLocale
      case 'en':
      default:
        return enLocale
    }
  }

  const encodedUrl = encodeURIComponent(propertyConfig.icalUrl)
  const apiUrl = `/api/ics?url=${encodedUrl}`

  return (
    <Card>
      <CardContent>
        <FullCalendar
          plugins={[dayGridPlugin, iCalendarPlugin]}
          initialView='dayGridMonth'
          locale={getCalendarLocale()}
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next',
          }}
          events={{
            url: apiUrl,
            format: 'ics',
          }}
          eventColor='var(--color-destructive)'
          height='auto'
          eventDisplay='block'
        />
      </CardContent>
    </Card>
  )
}
