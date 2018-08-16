import { expectDomStructure, h, runTest } from '../../utils'

interface Spec {
  insertAtStart: string
  insertAtEnd: string
  insertAtMiddle: string

  removeAtStart: string
  removeAtEnd: string
  removeAtMiddle: string

  insertAtStartAndEnd: string
  insertEverywhere: string
  removeAtStartAndEnd: string

  noChange: string
  reverseOdd: string
  reverseEven: string

  completeChange: string

  complexChanges: string

  fromEmpty: string
  toEmpty: string
}

const defaultSpec: Spec = {
  insertAtStart: 'abc',
  insertAtEnd: 'abc',
  insertAtMiddle: 'abc',

  removeAtStart: 'abc',
  removeAtEnd: 'abc',
  removeAtMiddle: 'abc',

  insertAtStartAndEnd: 'abc',
  insertEverywhere: 'abc',
  removeAtStartAndEnd: 'abc',

  noChange: 'abc',
  reverseOdd: 'abc',
  reverseEven: 'abcd',

  completeChange: 'abc',

  complexChanges: 'abcdef',

  fromEmpty: '',
  toEmpty: 'abc',
}

function singleSpecDom (spec: string) {
  const spans = spec.split('').map(letter => h.span(letter))
  const buttons = [h.button('Change')]
  return [...spans, ...buttons]
}

const shadow0 = { 'data-w-0': '' }

function dom (spec: Spec) {
  return h.body([
    h.script({ src: 'index.js' }),
    h('w-insert-at-start', { ...shadow0 }, singleSpecDom(spec.insertAtStart)),
    h('w-insert-at-end', { ...shadow0 }, singleSpecDom(spec.insertAtEnd)),
    h('w-insert-at-middle', { ...shadow0 }, singleSpecDom(spec.insertAtMiddle)),

    h('w-remove-at-start', { ...shadow0 }, singleSpecDom(spec.removeAtStart)),
    h('w-remove-at-end', { ...shadow0 }, singleSpecDom(spec.removeAtEnd)),
    h('w-remove-at-middle', { ...shadow0 }, singleSpecDom(spec.removeAtMiddle)),

    h('w-insert-at-start-and-end', { ...shadow0 }, singleSpecDom(spec.insertAtStartAndEnd)),
    h('w-insert-everywhere', { ...shadow0 }, singleSpecDom(spec.insertEverywhere)),
    h('w-remove-at-start-and-end', { ...shadow0 }, singleSpecDom(spec.removeAtStartAndEnd)),

    h('w-no-change', { ...shadow0 }, singleSpecDom(spec.noChange)),
    h('w-reverse-odd', { ...shadow0 }, singleSpecDom(spec.reverseOdd)),
    h('w-reverse-even', { ...shadow0 }, singleSpecDom(spec.reverseEven)),

    h('w-complete-change', { ...shadow0 }, singleSpecDom(spec.completeChange)),
    h('w-complex-changes', { ...shadow0 }, singleSpecDom(spec.complexChanges)),

    h('w-from-empty', { ...shadow0 }, singleSpecDom(spec.fromEmpty)),
    h('w-to-empty', { ...shadow0 }, singleSpecDom(spec.toEmpty)),
  ])
}

const buttons: Spec = {
  insertAtStart: 'w-insert-at-start > button',
  insertAtEnd: 'w-insert-at-end > button',
  insertAtMiddle: 'w-insert-at-middle > button',

  removeAtStart: 'w-remove-at-start > button',
  removeAtEnd: 'w-remove-at-end > button',
  removeAtMiddle: 'w-remove-at-middle > button',

  insertAtStartAndEnd: 'w-insert-at-start-and-end > button',
  insertEverywhere: 'w-insert-everywhere > button',
  removeAtStartAndEnd: 'w-remove-at-start-and-end > button',

  noChange: 'w-no-change > button',
  reverseOdd: 'w-reverse-odd > button',
  reverseEven: 'w-reverse-even > button',

  completeChange: 'w-complete-change > button',
  complexChanges: 'w-complex-changes > button',

  fromEmpty: 'w-from-empty > button',
  toEmpty: 'w-to-empty > button',
}

function merge (spec: Spec, newSpec: Partial<Spec>): Spec {
  return Object.assign(spec, newSpec)
}

export default function () {
  return runTest(__dirname, async page => {

    const spec = defaultSpec
    const testDom = async (spec: Spec, reason?: string) => {
      try {
        const builtDom = dom(spec)
        await expectDomStructure(page, builtDom)
      } catch (e) {
        if (reason != null) {
          console.error(`Reason: ${reason}`)
        }
        throw e
      }
    }

    await testDom(spec, `Initial page structure.`)

    await page.click(buttons.insertAtStart)
    merge(spec, { insertAtStart: 'xabc' })
    await testDom(spec, 'Insert at start.')

    await page.click(buttons.insertAtEnd)
    merge(spec, { insertAtEnd: 'abcx' })
    await testDom(spec, 'Insert at end.')

    await page.click(buttons.insertAtMiddle)
    merge(spec, { insertAtMiddle: 'axbc' })
    await testDom(spec, `Insert at middle.`)

    await page.click(buttons.removeAtStart)
    merge(spec, { removeAtStart: 'bc' })
    await testDom(spec, `Remove at start.`)

    await page.click(buttons.removeAtEnd)
    merge(spec, { removeAtEnd: 'ab' })
    await testDom(spec, `Remove at end.`)

    await page.click(buttons.removeAtMiddle)
    merge(spec, { removeAtMiddle: 'ac' })
    await testDom(spec, `Remove at middle.`)

    await page.click(buttons.insertAtStartAndEnd)
    merge(spec, { insertAtStartAndEnd: 'xabcy' })
    await testDom(spec, `Insert at start and end.`)

    await page.click(buttons.insertEverywhere)
    merge(spec, { insertEverywhere: 'xaybcz' })
    await testDom(spec, `Insert everywhere.`)

    await page.click(buttons.noChange)
    merge(spec, { noChange: 'abc' })
    await testDom(spec, `No change.`)

    await page.click(buttons.reverseOdd)
    merge(spec, { reverseOdd: 'cba' })
    await testDom(spec, `Reverse odd.`)

    await page.click(buttons.reverseEven)
    merge(spec, { reverseEven: 'dcba' })
    await testDom(spec, `Reverse even.`)

    await page.click(buttons.completeChange)
    merge(spec, { completeChange: 'xyz' })
    await testDom(spec, `Complete change`)

    await page.click(buttons.complexChanges)
    merge(spec, { complexChanges: 'axdbcf' })
    await testDom(spec, `Complex changes`)

    await page.click(buttons.toEmpty)
    merge(spec, { toEmpty: '' })
    await testDom(spec, `To empty.`)

    await page.click(buttons.fromEmpty)
    merge(spec, { fromEmpty: 'abc' })
    await testDom(spec, `From empty.`)

  })
}
