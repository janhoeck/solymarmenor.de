import { IconType } from './IconType'

export type TranslationMap = {
  de: string
  en: string
  es: string
}

export type PropertyDetailItem = {
  type: IconType
  amount: number
  title: TranslationMap
  subtitle: TranslationMap
}

export type DescriptionItem = TranslationMap | { text?: TranslationMap; bulletpoints: TranslationMap[] }
export type Description = Array<DescriptionItem>

export type Amenities = {
  general?: Extract<
    IconType,
    | 'barrier_free'
    | 'elevator'
    | 'fire_extinguisher'
    | 'smoke_detector'
    | 'parking'
    | 'air_conditioner'
    | 'tv'
    | 'wlan'
    | 'vacuum'
    | 'washing_machine'
    | 'washing_rack'
  >[]
  outdoorArea?: Extract<IconType, 'pool' | 'balcony' | 'terrace'>[]
  kitchen?: Extract<
    IconType,
    'refrigerator' | 'freezer' | 'cooker' | 'oven' | 'microwave' | 'coffee_machine' | 'pots_pans' | 'dishes' | 'kettle'
  >[]
  bathroom?: Extract<IconType, 'shower' | 'bathtub' | 'hairdryer' | 'towels'>[]
  bedroom?: Extract<IconType, 'bed_linen'>[]
  baby?: Extract<IconType, 'baby_bed' | 'high_chair'>[]
}

export type Address = {
  building?: string
  street: string
  houseNumber: string
  floorApartment?: string
  postalCode: string
  city: string
  country: string
  description?: TranslationMap
}

export type Location = {
  lat: number
  lng: number
  address: Address
  description: Description
}

export type HouseRules = {
  checkIn: TranslationMap
  checkOut: TranslationMap
  rules: Extract<IconType, 'pet' | 'party' | 'smoking'>[]
  description?: Description
}

export type PriceConfig = {
  perNight: {
    offSeason: number
    mainSeason: number
  }
  cleaning?: number
}

export type PropertyConfiguration = {
  id: string
  icalUrl?: string
  imageSources: string[]
  title: TranslationMap
  subtitle: TranslationMap
  description: Description
  price: PriceConfig
  location: Location
  propertyDetails: PropertyDetailItem[]
  amenities: Amenities
  houseRules: HouseRules
}
