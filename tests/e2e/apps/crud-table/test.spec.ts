import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'
import { VNode } from '../../utils/vdom'

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

function dom (domProps: DomProps) {
  return h.body([
    h.script({ src: 'index.js' }),
    h.table([
      h.tr([
        h.th(`Name`),
        h.th(`Age`),
        h.th(`Continent`),
        h.th({ colspan: '' }, [`Actions`]), // TODO: This a bug, should be colspan: 2
      ]),
      ...domProps.tableData.map(row => {
        return h.tr(row.map(cell => h.td([cell])))
      }),
    ]),
    h.button({ type: 'button' }, [`Add new`]),
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

  })
}
