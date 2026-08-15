import { resolveText } from '../../data/localized-text.ts'
import type { Property } from '../../data/property-schema.ts'
import { absoluteUrl, localizedPathname } from '../metadata.ts'
import { plainText } from './text.ts'

/** UN/CEFACT code for square metre, which is what schema.org expects. */
const SQUARE_METRE = 'MTK'

type QuantitativeValue = {
  '@type': 'QuantitativeValue'
  value?: number
  maxValue?: number
  unitCode?: string
}

/**
 * Declared rather than inferred. The optional fields below are produced by
 * conditional spreads, which TypeScript infers as a union of two object shapes
 * — and a union makes `data.numberOfBedrooms` an error in the tests rather than
 * an optional read. Naming the shape also documents what this emits.
 */
export type VacationRentalData = {
  '@context': string
  '@type': 'VacationRental'
  name: string
  description: string
  url: string
  image: string[]
  address: {
    '@type': 'PostalAddress'
    streetAddress: string
    postalCode: string
    addressLocality: string
    addressCountry: string
  }
  geo: { '@type': 'GeoCoordinates'; latitude: number; longitude: number }
  checkinTime: string
  checkoutTime: string
  petsAllowed: boolean
  smokingAllowed: boolean
  priceRange: string
  numberOfBedrooms?: number
  numberOfBathroomsTotal?: number
  occupancy?: QuantitativeValue
  floorSize?: QuantitativeValue
  amenityFeature: Array<{ '@type': 'LocationFeatureSpecification'; name: string; value: boolean }>
}

function highlight(property: Property, key: string): number | undefined {
  return property.highlights.find((entry) => entry.key === key)?.value
}

/**
 * Builds the VacationRental description of a property.
 *
 * Amenity names come in from the caller rather than being resolved here: their
 * labels live in next-intl, whose server API would drag a Next runtime into a
 * function that is otherwise pure and therefore testable.
 *
 * Every field is derived from data `property-schema.ts` already enforces, so
 * this adds no new editorial burden.
 */
export function buildVacationRental(property: Property, locale: string, amenityNames: string[]): VacationRentalData {
  const nightlyRates = property.pricing.rates.map((rate) => rate.pricePerNight)
  const bedrooms = highlight(property, 'bedrooms')
  const bathrooms = highlight(property, 'bathrooms')
  const guests = highlight(property, 'guests')
  const area = highlight(property, 'area')
  const { address } = property.location

  return {
    '@context': 'https://schema.org',
    '@type': 'VacationRental',
    name: resolveText(property.title, locale),
    description: plainText(property.description, locale),
    url: absoluteUrl(localizedPathname(`/property/${property.slug}`, locale)),
    image: [property.images.cover, ...property.images.gallery].map((image) => absoluteUrl(image.src)),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${address.street} ${address.houseNumber}`,
      postalCode: address.postalCode,
      addressLocality: address.city,
      addressCountry: address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.location.lat,
      longitude: property.location.lng,
    },
    checkinTime: property.houseRules.checkInFrom,
    checkoutTime: property.houseRules.checkOutUntil,
    // houseRules.rules lists what is NOT allowed — see descriptions.pet,
    // "Keine Haustiere erlaubt". Hence the negation; copying the membership
    // test straight through would publish the opposite of the truth.
    petsAllowed: !property.houseRules.rules.includes('pet'),
    smokingAllowed: !property.houseRules.rules.includes('smoking'),
    priceRange: `€${Math.min(...nightlyRates)}–€${Math.max(...nightlyRates)}`,
    // Spread-or-nothing rather than an undefined value: JSON.stringify would
    // drop an undefined anyway, but an explicitly absent key is easier to
    // assert on and reads the same in the output.
    ...(bedrooms === undefined ? {} : { numberOfBedrooms: bedrooms }),
    ...(bathrooms === undefined ? {} : { numberOfBathroomsTotal: bathrooms }),
    ...(guests === undefined ? {} : { occupancy: { '@type': 'QuantitativeValue', maxValue: guests } }),
    ...(area === undefined ? {} : { floorSize: { '@type': 'QuantitativeValue', value: area, unitCode: SQUARE_METRE } }),
    amenityFeature: amenityNames.map((name) => ({
      '@type': 'LocationFeatureSpecification',
      name,
      value: true,
    })),
  }
}
