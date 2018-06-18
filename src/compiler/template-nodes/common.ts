import { TemplateNodeConditionalViewValue } from './nodes/conditional-view-node'
import { TemplateNodeRepeatingViewValue } from './nodes/repeating-view-node'

export type TemplateNodePartialViewValue =
  TemplateNodeConditionalViewValue
  | TemplateNodeRepeatingViewValue
