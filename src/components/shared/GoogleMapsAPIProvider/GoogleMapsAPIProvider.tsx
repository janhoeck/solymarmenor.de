'use client'

import { APIProvider } from '@vis.gl/react-google-maps'
import { PropsWithChildren } from 'react'

export const GoogleMapsAPIProvider = ({ children }: PropsWithChildren) => {
  return <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>{children}</APIProvider>
}
