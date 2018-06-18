/**
 * All types
 */

export const enum TemplateNodeType {
  Text,
  Interpolation,
  Html,
  Component,
  ConditionalView,
  RepeatingView,
}

/**
 * Text
 */

export interface TemplateNodeTextPojoValue {
  type: TemplateNodeType.Text
  content: string
}

/**
 * Interpolation
 */

// TODO: Allow binding

export interface TemplateNodeInterpolationPojoValue {
  type: TemplateNodeType.Interpolation
  propAccessPath: string
}

/**
 * Props
 */

export const enum TemplateNodePropType {
  Literal,
  PropAccessorPath,
}

export interface TemplateNodePropLiteral {
  type: TemplateNodePropType.Literal
  value: any
}

export interface TemplateNodePropBoundPropAccessorPath {
  type: TemplateNodePropType.PropAccessorPath
  propAccessorPath: string
}

export type TemplateNodeProp =
  TemplateNodePropLiteral
  | TemplateNodePropBoundPropAccessorPath

/**
 * Events
 */

export const enum TemplateNodeEventFunctionArgType {
  Literal,
  Property,
  Placeholder,
}

export interface TemplateNodeEventFunctionArgLiteral {
  type: TemplateNodeEventFunctionArgType.Literal
  value: any
}

export interface TemplateNodeEventFunctionArgProperty {
  type: TemplateNodeEventFunctionArgType.Property
  name: string
}

export interface TemplateNodeEventFunctionArgPlaceholder {
  type: TemplateNodeEventFunctionArgType.Placeholder
}

export type TemplateNodeEventFunctionArg =
  TemplateNodeEventFunctionArgLiteral |
  TemplateNodeEventFunctionArgProperty |
  TemplateNodeEventFunctionArgPlaceholder

export interface TemplateNodeEvent {
  name: string
  args: TemplateNodeEventFunctionArg[]
}

/**
 * Html elements
 */

export interface TemplateNodeHtmlPojoValue {
  type: TemplateNodeType.Html
  tagName: keyof HTMLElementTagNameMap
  attrs: [string, TemplateNodeProp][]
  props: [string, TemplateNodeProp][]
  events: [string, TemplateNodeEvent][]
}

/**
 * Components
 */

export interface TemplateNodeComponentPojoValue {
  type: TemplateNodeType.Component
  tagName: string
  attrs: [string, TemplateNodeProp][]
  props: [string, TemplateNodeProp][]
  events: [string, TemplateNodeEvent][]
}

/**
 * Conditional views
 */

export interface TemplateNodeConditionalViewPojoValue {
  type: TemplateNodeType.ConditionalView
  condition: {
    valueAccessorPath: string
    isNegated: boolean
  }
}

/**
 * Repeating views
 */

export interface TemplateNodeRepeatingViewPojoValue {
  type: TemplateNodeType.RepeatingView
  boundValueAccessorPath: string // item of ITEMS // item of FOO.ITEMS
  iterativeConstantName: string // ITEM of items
  indexConstantName: string | undefined // (item, INDEX) of items
  keyAccessorPath: string | undefined // (item, index) of items; key: ID
}

/**
 * All
 */

export type TemplateNodePojoValue =
  TemplateNodeTextPojoValue |
  TemplateNodeInterpolationPojoValue |
  TemplateNodeHtmlPojoValue |
  TemplateNodeComponentPojoValue |
  TemplateNodeConditionalViewPojoValue |
  TemplateNodeRepeatingViewPojoValue

/**
 * Utils
 */
