import { type Property, propertySchema } from '../property-schema.ts'
import apartment from './apartment.json' with { type: 'json' }
import house from './house.json' with { type: 'json' }

/**
 * Parsing happens at module load, so invalid data fails the build instead of
 * producing a 404 at runtime. Add a new property by adding an import here.
 */
export const properties: Property[] = [apartment, house].map((raw) => propertySchema.parse(raw))
