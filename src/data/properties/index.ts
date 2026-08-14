import { type Property, propertySchema } from '../property-schema.ts'
import apartment from './apartment.json' with { type: 'json' }
import house from './house.json' with { type: 'json' }

/**
 * Parsing happens at module load, and the app reaches this module through
 * `src/lib/properties/repository.ts`, so invalid data fails `pnpm build` rather
 * than producing a runtime 404.
 *
 * Add a new property by adding both the JSON file and an import here. Forgetting
 * the import is caught by `data.test.ts`, which compares the loaded ids against
 * the files in this directory.
 */
export const properties: Property[] = [apartment, house].map((raw) => propertySchema.parse(raw))
