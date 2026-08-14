import { type Property, propertySchema } from '../property-schema.ts'
import apartment from './apartment.json' with { type: 'json' }
import house from './house.json' with { type: 'json' }

/**
 * Parsing happens at module load. Once Task 4 wires this index into the app
 * (replacing the `fs`-based `loadPropertyConfigs`), invalid data will fail the
 * build instead of producing a runtime 404. Add a new property by adding an
 * import here.
 */
export const properties: Property[] = [apartment, house].map((raw) => propertySchema.parse(raw))
