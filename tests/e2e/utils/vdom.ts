import * as puppeteer from 'puppeteer'
import { expect } from 'chai'

export interface VNode {
  tagName: string
  attributes: Record<string, any>
  children: (VNode | string)[]
}

export interface HTag {
  (): VNode

  (attributes: Record<string, any>): VNode

  (textContent: string): VNode

  (children: (VNode | string)[]): VNode

  (attributes: Record<string, any>, children: (VNode | string)[]): VNode
}

export interface H {
  (tagName: string): VNode

  (tagName: string, attributes: Record<string, any>): VNode

  (tagName: string, textContent: string): VNode

  (tagName: string, children: (VNode | string)[]): VNode

  (tagName: string, attributes: Record<string, any>, children: (VNode | string)[]): VNode

  body: HTag
  div: HTag
  span: HTag
  p: HTag
  form: HTag
  label: HTag
  input: HTag
  select: HTag
  option: HTag
  script: HTag
  button: HTag
  hr: HTag
  h1: HTag
  h2: HTag
  h3: HTag
  h4: HTag
  h5: HTag
  h6: HTag
  header: HTag
  main: HTag
  footer: HTag
  b: HTag
  i: HTag
  u: HTag
  strong: HTag
  em: HTag
  dl: HTag
  dt: HTag
  dd: HTag
  table: HTag
  tr: HTag
  th: HTag
  td: HTag
}

const hFun: H = ((tagName: string, second?: any, third?: any): VNode => {
  tagName = tagName.toLowerCase()
  if (second === undefined && third === undefined) {
    // only "tagName" overload
    return {
      tagName,
      attributes: {},
      children: [],
    }
  }
  if (third === undefined) {
    if (typeof second == 'string') {
      // tagName + textContent
      return {
        tagName,
        attributes: {},
        children: [second],
      }
    }
    if (Array.isArray(second)) {
      // tagName + children
      return {
        tagName,
        attributes: {},
        children: second.filter(Boolean),
      }
    }
    if (typeof second == 'object') {
      // tagName + attributes
      return {
        tagName,
        attributes: second,
        children: [],
      }
    }
  }
  // the full overload
  return {
    tagName,
    attributes: second,
    children: third.filter(Boolean),
  }
}) as any

const hTag = (tagName: string) => (second?: any, third?: any) => hFun(tagName, second, third)

const tagNames = [
  'body',
  'div',
  'span',
  'p',
  'form',
  'label',
  'select',
  'option',
  'input',
  'script',
  'button',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'main',
  'footer',
  'b',
  'i',
  'u',
  'strong',
  'em',
  'dl',
  'dt',
  'dd',
  'table',
  'tr',
  'th',
  'td',
]

tagNames.forEach(tagName => {
  (hFun as any)[tagName] = hTag(tagName)
})

function toQuery (vNode: VNode, path: string, childIndex: number | undefined | null): string {
  const { tagName, attributes } = vNode
  if (attributes == null) console.log(vNode)
  const attrs = Object.entries(attributes)
  const standalone = `${tagName}${attrs.map(([key, value]) => value != null && value != ''
    ? `[${key}="${value}"]`
    : `[${key}]`).join('')}`
  const withIndex = childIndex == null ? standalone : `${standalone}:nth-child(${childIndex + 1})`
  return path == '' ? withIndex : `${path} > ${withIndex}`
}

async function expectHtmlElement (page: puppeteer.Page, vNode: VNode, path: string, childIndex: number | undefined | null) {
  const query = toQuery(vNode, path, childIndex)

  const element = await page.$(query)
  // noinspection BadExpressionStatementJS
  expect(element, query).to.be.ok

  // Although query already uses attributes to target an element,
  // here we assure that no additional shit exists on it.
  const attributes = await page.evaluate((query: string) => {
    const element = document.querySelector(query)!
    const namedMap = element.attributes
    const actualAttributes: Record<string, any> = {}
    for (let i = 0; i < namedMap.length; i++) {
      const { name, value } = namedMap.item(i)!
      actualAttributes[name] = value
    }
    return actualAttributes
  }, query)
  expect(vNode.attributes).to.deep.equal(attributes)

  let i: number = 0
  for (const child of vNode.children) {
    if (typeof child == 'object') {
      await expectHtmlElement(page, child, query, i)
      i++
    } else {
      const textContent: string = await page.evaluate((query: string) => {
        const { textContent } = document.querySelector(query)!
        return textContent
      }, query)
      expect(textContent.replace(/\s+/g, ' ').trim()).to.have.string(child)
    }
  }
}

export async function expectDomStructure (page: puppeteer.Page, vDom: VNode) {
  await expectHtmlElement(page, vDom, ``, null)
}

export { hFun as h }
