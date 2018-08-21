import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'

function dom () {
  return h.body([
    h.script({ src: 'index.js' }),
  ])
}

export default function () {
  return runTest(__dirname, async page => {

    const testDom = () => expectDomStructure(page, dom())

    // The page opens
    expect(page).to.be.ok

  })
}
