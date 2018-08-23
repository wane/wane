import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'

const shadow = (id: number) => ({ [`data-w-${id}`]: '' })

interface TodoItem {
  text: string
  isComplete?: boolean
  isEditMode?: boolean
}

type Filter = 'all' | 'complete' | 'incomplete'

type DomData = {
  filter: Filter
  items: TodoItem[]
  totalItemsCount: number
}

function domTodoItem (item: TodoItem) {
  if (item.isEditMode) {
    return h('w-item', [
      h('w-edit', shadow(10), [
        h.input({ type: 'text', 'aria-label': `Change text` }),
      ]),
    ])
  } else {
    return h('w-item', [
      h.div({
        ...shadow(10),
        class: item.isComplete ? 'complete' : '',
      }, [
        h.span(shadow(10), [item.text]),
        h.button(shadow(10), [item.isComplete ? `Undo` : `Done`]),
        !item.isComplete && h.button(shadow(10), [`Edit`]),
      ]),
    ])
  }
}

function domFilters (filter: Filter) {
  return h('w-filters', [
    h.button({ ...shadow(21), type: 'button', class: filter == 'all' ? 'selected' : '' }, [`All`]),
    h.button({
      ...shadow(21),
      type: 'button',
      class: filter == 'complete' ? 'selected' : '',
    }, [`Complete`]),
    h.button({
      ...shadow(21),
      type: 'button',
      class: filter == 'incomplete' ? 'selected' : '',
    }, [`Incomplete`]),
  ])
}

function domItemCreator () {
  return h('w-item-creator', [
    h.form([
      h.label([
        h.span(`New item`),
        h.input({ type: 'text', name: 'text' }),
      ]),
      h.button({ type: 'submit' }, [`Add`]),
    ]),
  ])
}

function dom ({ totalItemsCount, items, filter }: DomData) {
  if (totalItemsCount == 0) {
    return h.body([
      h.script({ src: 'index.js' }),
      h('w-list', [
        h.p({ class: 'empty' }, [`The list is empty.`]),
        domItemCreator(),
      ]),
      domFilters(filter),
    ])
  } else if (items.length == 0) {
    return h.body([
      h.script({ src: 'index.js' }),
      h('w-list', [
        h.p({ class: 'empty' }, [
          `No items to show for this filter.`,
          h.br(),
          `There are `,
          totalItemsCount.toString(10),
          ` items in total.`,
        ]),
        domItemCreator(),
      ]),
      domFilters(filter),
    ])
  } else {
    return h.body([
      h.script({ src: 'index.js' }),
      h('w-list', [
        h.ol(items.map(item => {
          return h.li([domTodoItem(item)])
        })),
        domItemCreator(),
      ]),
      domFilters(filter),
    ])
  }
}

const selector = {
  itemToggleButton (n: number) {
    return `w-list > ol > li:nth-child(${n}) > w-item > div > button:first-of-type`
  },
  itemEditButton (n: number) {
    return `w-list > ol > li:nth-child(${n}) > w-item > div > button:nth-of-type(2)`
  },
  itemEditInput (n: number) {
    return `w-list > ol > li:nth-child(${n}) > w-item > w-edit > input`
  },
  filter (filter: Filter) {
    const index = ['all', 'complete', 'incomplete'].indexOf(filter)
    return `w-filters > button:nth-child(${index + 1})`
  },
}

export default function () {
  return runTest(__dirname, async page => {

    const testDom = (domData: DomData, failure?: string) =>
      expectDomStructure(page, dom(domData), failure)

    await testDom({ totalItemsCount: 0, items: [], filter: 'all' }, `Initial page structure`)

    await page.type(`[name="text"]`, `first`)
    await page.keyboard.press('Enter')
    await testDom({
      totalItemsCount: 1,
      items: [{ text: `first` }],
      filter: 'all',
    }, `After adding "first"`)

    await page.type(`[name="text"]`, `second`)
    await page.click(`w-item-creator form button[type=submit]`)
    await testDom({
      totalItemsCount: 2,
      items: [{ text: `first` }, { text: `second` }],
      filter: 'all',
    }, `After adding "second"`)

    await page.type(`[name="text"]`, `third`)
    await page.keyboard.press('Enter')
    await testDom({
      totalItemsCount: 3,
      items: [{ text: `first` }, { text: `second` }, { text: `third` }],
      filter: 'all',
    }, `After adding "third"`)

    await page.click(selector.itemToggleButton(2))
    await testDom({
      totalItemsCount: 3,
      items: [{ text: `first` }, { text: `second`, isComplete: true }, { text: `third` }],
      filter: 'all',
    }, `After completing "second"`)

    await page.click(selector.itemToggleButton(3))
    await testDom({
      totalItemsCount: 3,
      items: [
        { text: `first` },
        { text: `second`, isComplete: true },
        { text: `third`, isComplete: true },
      ],
      filter: 'all',
    }, `After completing "third"`)

    await page.click(selector.filter('complete'))
    await testDom({
      totalItemsCount: 3,
      items: [
        { text: `second`, isComplete: true },
        { text: `third`, isComplete: true },
      ],
      filter: 'complete',
    }, `After changing filter to "Complete"`)

    await page.click(selector.filter('all'))
    await testDom({
      totalItemsCount: 3,
      items: [
        { text: `first` },
        { text: `second`, isComplete: true },
        { text: `third`, isComplete: true },
      ],
      filter: 'all',
    }, `After changing filter to "All"`)

    await page.click(selector.filter('incomplete'))
    await testDom({
      totalItemsCount: 3,
      items: [
        { text: `first` },
      ],
      filter: 'incomplete',
    }, `After changing filter to "Incomplete"`)

    await page.click(selector.itemToggleButton(1))
    await testDom({
      totalItemsCount: 3,
      items: [],
      filter: 'incomplete',
    }, `After marking as complete the only item left in "Incomplete" filter`)

    await page.click(selector.filter('complete'))
    await testDom({
      totalItemsCount: 3,
      items: [
        { text: `first`, isComplete: true },
        { text: `second`, isComplete: true },
        { text: `third`, isComplete: true },
      ],
      filter: 'complete',
    }, `After changing to "Complete" to see all three as completed`)

    await page.click(selector.itemToggleButton(3))
    await testDom({
      totalItemsCount: 3,
      items: [
        { text: `first`, isComplete: true },
        { text: `second`, isComplete: true },
      ],
      filter: 'complete',
    }, `After marking one of three as complete in Completed filter`)


    await page.click(selector.filter('all'))
    await page.click(selector.itemToggleButton(1))
    await page.click(selector.itemToggleButton(2))
    await testDom({
      totalItemsCount: 3,
      items: [{ text: `first` }, { text: `second` }, { text: `third` }],
      filter: 'all',
    }, `After resetting all and back to "All"`)

    await page.click(selector.itemEditButton(1))
    await testDom({
      totalItemsCount: 3,
      items: [{ text: `first`, isEditMode: true }, { text: `second` }, { text: `third` }],
      filter: 'all',
    }, `After entering edit mode for "first"`)

    await page.type(selector.itemEditInput(1), `new name`)
    await page.keyboard.press('Enter')
    await testDom({
      totalItemsCount: 3,
      items: [{ text: `new name` }, { text: `second` }, { text: `third` }],
      filter: 'all',
    }, `After editing "first" into "new name"`)

    await page.click(selector.itemEditButton(2))
    await testDom({
      totalItemsCount: 3,
      items: [{ text: `new name` }, { text: `second`, isEditMode: true }, { text: `third` }],
      filter: 'all',
    }, `After entering edit mode for "second"`)

    await page.focus(selector.itemEditInput(2))
    await page.type(selector.itemEditInput(2), `foo bar`)
    await page.keyboard.press('Escape')
    await testDom({
      totalItemsCount: 3,
      items: [{ text: `new name` }, { text: `second` }, { text: `third` }],
      filter: 'all',
    }, `After pressing ESC while on edit for "second"`)

  })
}
