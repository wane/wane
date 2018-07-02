import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'

export default function () {
  return runTest(__dirname, async page => {

    // DOM structure on page init
    await expectDomStructure(page, h.body([
      h.script({ src: 'index.js' }),
      'Hello World!',
    ]))
  })

}
