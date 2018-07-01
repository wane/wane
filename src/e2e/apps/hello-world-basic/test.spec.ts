import * as puppeteer from 'puppeteer'
import { expect } from 'chai'

export default async function helloWorldBasic (page: puppeteer.Page) {

  // Basic text
  {
    const bodyInnerText = await page.evaluate(() => document.body.innerText)
    expect(bodyInnerText).to.equal(`Hello World!`)
  }

}
