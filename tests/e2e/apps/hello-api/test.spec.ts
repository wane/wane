import { runTest } from "../../utils"
import { expect } from 'chai'

export default function () {
  return runTest(__dirname, async page => {

    expect(page).to.be.ok

  })
}
