import type { Property } from '@/data/property-schema'
import { isDefined } from '@/utils/array'
import fs from 'fs'
import path from 'path'

export const loadPropertyConfigs = (): Property[] => {
  try {
    const filePath = path.join(process.cwd(), 'src/data/properties')
    const dictionaryFileNames = fs.readdirSync(filePath)
    return dictionaryFileNames.map((fileName) => loadPropertyConfig(fileName.split('.')[0]!)).filter(isDefined)
  } catch (error) {
    console.error(error)
  }
  return []
}

export const loadPropertyConfig = (id: string): Property | undefined => {
  try {
    const filePath = path.join(process.cwd(), 'src/data/properties', `${id}.json`)
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return jsonData as Property
  } catch (error) {
    console.error(error)
    return undefined
  }
}
