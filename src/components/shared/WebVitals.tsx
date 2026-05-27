'use client'

import { useReportWebVitals } from 'next/web-vitals'

export const WebVitals = () => {
  useReportWebVitals(console.table)
  return null
}
