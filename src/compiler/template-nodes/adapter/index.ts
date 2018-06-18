// import { TemplateNodePojoValue } from '../common'
// import { TemplateNodeType } from '../../template-parser/html'
// import { TemplateNodeTextValue } from '../nodes/text-node'
// import { TemplateNodeInterpolationValue } from '../nodes/interpolation-node'
// import { TemplateNodeHtmlValue } from '../nodes/html-node'
// import { TemplateNodeComponentValue } from '../nodes/component-node'
// import { TemplateNodeConditionalViewValue } from '../nodes/conditional-view-node'
// import { TemplateNodeRepeatingViewValue } from '../nodes/repeating-view-node'
// import { TemplateNodeValue } from '../nodes/template-node-value-base'
//
// interface Constructor<T> {
//   new (...args: any[]): T
// }
//
// const map = new Map<TemplateNodeType, Constructor<TemplateNodeValue>>([
//   [TemplateNodeType.Text, TemplateNodeTextValue],
//   [TemplateNodeType.Interpolation, TemplateNodeInterpolationValue],
//   [TemplateNodeType.Html, TemplateNodeHtmlValue],
//   [TemplateNodeType.Component, TemplateNodeComponentValue],
//   [TemplateNodeType.ConditionalView, TemplateNodeConditionalViewValue],
//   [TemplateNodeType.RepeatingView, TemplateNodeRepeatingViewValue],
// ])
//
// export default function createTemplateNodeValue (pojoValue: TemplateNodePojoValue): TemplateNodeValue {
//   const klass = map.get(pojoValue.type)
//   if (klass == null) {
//     throw Error(`Loading POJO value with type ${pojoValue.type} not yet supported.`)
//   }
//   return new klass(pojoValue)
// }
