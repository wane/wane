import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'
import { VNode } from '../../utils/vdom'
import { asyncRepeat, getValue } from '../../utils/puppeteer-utils'

interface DomProps {
  tableData: (VNode | string)[][]
  isAddNewVisible?: boolean
}

function editButton () {
  return h.button({ type: 'button' }, [`Edit`])
}

function removeButton () {
  return h.button({ type: 'button' }, [`Remove`])
}

function continentsSelect () {
  return h.select({ name: 'continent' }, [
      h.option({ value: '' }, [`Unknown`]),
      ...[
        `Africa`,
        `Antarctica`,
        `Asia`,
        `Europe`,
        `North America`,
        `Oceania`,
        `South America`,
      ].map(continent => h.option({ value: continent }, [continent])),
    ],
  )
}

function dom (domProps: DomProps) {
  return h.body([
    h.script({ src: 'index.js' }),
    domProps.tableData.length > 0
      ?
      h.table([
        h.tr([
          h.th(`Name`),
          h.th(`Age`),
          h.th(`Continent`),
          h.th({ colspan: '2' }, [`Actions`]),
        ]),
        ...domProps.tableData.map(row => {
          return h.tr(row.map(cell => h.td([cell])))
        }),
      ])
      :
      h('w-empty-state', [
        `No entered data.`,
        h.button(`Add some!`),
      ]),
    h.button({ type: 'button' }, [`Add new`]),
    domProps.isAddNewVisible
      ? h('w-form', [
        h.form([
          h.label([
            h.span(`Name`),
            h.input({ type: 'text', name: 'name' }),
          ]),
          h.label([
            h.span(`Age`),
            h.input({ type: 'number', name: 'age' }),
          ]),
          h.label([
            h.span(`Continent`),
            continentsSelect(),
          ]),
          h.button({ type: 'submit' }, [`Save`]),
          h.button({ type: 'button' }, [`Cancel`]),
        ]),
      ])
      : null,
  ])
}

function getActionSelector (row: number, action: 'edit' | 'remove') {
  const tdChildIndex = action == 'edit' ? 4 : 5
  return `table tr:nth-child(${row + 1}) > td:nth-child(${tdChildIndex}) > button`
}

export default function () {
  return runTest(__dirname, async page => {

    const testDom = (domProps: DomProps) => expectDomStructure(page, dom(domProps))

    // Initial page structure
    await testDom({
      tableData: [
        [`John Doe`, `42`, `Africa`, editButton(), removeButton()],
        [`Jane Doe`, `41`, `Antarctica`, editButton(), removeButton()],
        [`Don Joe`, `40`, `Asia`, editButton(), removeButton()],
        [`Donna Joe`, `39`, `Europe`, editButton(), removeButton()],
      ],
    })

    // Remove an item in the middle
    await page.click(getActionSelector(3, 'remove'))
    await testDom({
      tableData: [
        [`John Doe`, `42`, `Africa`, editButton(), removeButton()],
        [`Jane Doe`, `41`, `Antarctica`, editButton(), removeButton()],
        [`Donna Joe`, `39`, `Europe`, editButton(), removeButton()],
      ],
    })

    // Open the edit form for the first item
    await page.click(getActionSelector(1, 'edit'))
    await testDom({
      tableData: [
        [`John Doe`, `42`, `Africa`, editButton(), removeButton()],
        [`Jane Doe`, `41`, `Antarctica`, editButton(), removeButton()],
        [`Donna Joe`, `39`, `Europe`, editButton(), removeButton()],
      ],
      isAddNewVisible: true,
    })
    expect(await getValue(page, 'form [name=name]')).to.equal(`John Doe`)
    expect(await getValue(page, 'form [name=age]')).to.equal(`42`)
    expect(await getValue(page, 'form [name=continent]')).to.equal(`Africa`)

    // Remove surname, change age to 44 and continent to Asia
    await page.focus('form [name=name]')
    await asyncRepeat(4, () => page.keyboard.press('Backspace'))
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await testDom({
      tableData: [
        [`John`, `44`, `Asia`, editButton(), removeButton()],
        [`Jane Doe`, `41`, `Antarctica`, editButton(), removeButton()],
        [`Donna Joe`, `39`, `Europe`, editButton(), removeButton()],
      ],
    })

    // Open add new form
    await page.click('table ~ button')
    await testDom({
      tableData: [
        [`John`, `44`, `Asia`, editButton(), removeButton()],
        [`Jane Doe`, `41`, `Antarctica`, editButton(), removeButton()],
        [`Donna Joe`, `39`, `Europe`, editButton(), removeButton()],
      ],
      isAddNewVisible: true,
    })
    expect(await getValue(page, 'form [name=name]')).to.equal(``)
    expect(await getValue(page, 'form [name=age]')).to.equal(`0`)
    expect(await getValue(page, 'form [name=continent]')).to.equal(``)

    // Enter data and submit
    await page.focus('form [name=name]')
    await page.keyboard.type(`New user`)
    await page.keyboard.press('Tab')
    await page.keyboard.type(`38`)
    await page.keyboard.press('Tab')
    await asyncRepeat(5, () => page.keyboard.press('ArrowDown'))
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await testDom({
      tableData: [
        [`John`, `44`, `Asia`, editButton(), removeButton()],
        [`Jane Doe`, `41`, `Antarctica`, editButton(), removeButton()],
        [`Donna Joe`, `39`, `Europe`, editButton(), removeButton()],
        [`New user`, `38`, `North America`, editButton(), removeButton()],
      ],
    })

    // Remove all but one
    await asyncRepeat(3, () => page.click(getActionSelector(1, 'remove')))
    await testDom({
      tableData: [
        [`New user`, `38`, `North America`, editButton(), removeButton()],
      ],
    })

    // Remove the last one
    await page.click(getActionSelector(1, 'remove'))
    await testDom({
      tableData: [],
    })

    // Clicking on "Add new" opens the dialog
    await page.click('w-empty-state ~ button')
    await testDom({
      tableData: [],
      isAddNewVisible: true,
    })
    expect(await getValue(page, 'form [name=name]')).to.equal(``)
    expect(await getValue(page, 'form [name=age]')).to.equal(`0`)
    expect(await getValue(page, 'form [name=continent]')).to.equal(``)

    // Clicking on "Cancel" closes the form
    await page.click('form button[type=button]')
    await testDom({
      tableData: [],
    })

    // Clicking on "Add some!" opens the dialog
    await page.click('w-empty-state button')
    await testDom({
      tableData: [],
      isAddNewVisible: true,
    })
    expect(await getValue(page, 'form [name=name]')).to.equal(``)
    expect(await getValue(page, 'form [name=age]')).to.equal(`0`)
    expect(await getValue(page, 'form [name=continent]')).to.equal(``)

    // Add a new item
    await page.focus('form [name=name]')
    await page.keyboard.type(`New user`)
    await page.keyboard.press('Tab')
    await page.keyboard.type(`38`)
    await page.keyboard.press('Tab')
    await asyncRepeat(5, () => page.keyboard.press('ArrowDown'))
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await testDom({
      tableData: [
        [`New user`, `38`, `North America`, editButton(), removeButton()],
      ],
    })

  })
}
