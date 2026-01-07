import { type SchemaTypeDefinition } from 'sanity'
import course from './course'
import category from './category'
import instructor from './instructor'
import exam from './exam'
import manual from './manual'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [course, category, instructor, exam, manual],
}
