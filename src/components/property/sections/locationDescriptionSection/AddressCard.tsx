import type { Property } from '@/data/property-schema'
import { resolveText } from '@/data/localized-text'
import { safeJoin } from '@/utils/join'
import { Card, CardContent, Muted } from '@/components/ui'
import { useLocale } from 'next-intl'
import { LuMapPin } from 'react-icons/lu'

import { GoogleMaps } from './GoogleMaps'

export type AddressCardProps = {
  lat: number
  lng: number
  address: Property['location']['address']
}

export const AddressCard = (props: AddressCardProps) => {
  const { lat, lng, address } = props
  const locale = useLocale()

  return (
    <Card className='h-fit py-0 pb-6'>
      <GoogleMaps
        className='h-[320px] w-full overflow-hidden rounded-t-md'
        lat={lat}
        lng={lng}
      />
      <CardContent className='space-y-4'>
        <div className='flex items-start gap-3'>
          <LuMapPin
            size={20}
            className='text-primary mt-0.5'
          />
          <div>
            <div className='font-semibold'>
              {safeJoin([safeJoin([address.street, address.houseNumber], ' '), address.floorApartment], ', ')}
            </div>
            <div className='text-sm text-muted-foreground'>{[address.postalCode, address.city].join(' ')}</div>
          </div>
        </div>
        {address.note && <Muted>{resolveText(address.note, locale)}</Muted>}
      </CardContent>
    </Card>
  )
}
