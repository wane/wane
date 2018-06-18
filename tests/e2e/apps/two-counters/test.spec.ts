import * as puppeteer from 'puppeteer'
import { compileTestApp } from '../../utils'
import { expect } from 'chai'

export default async function runTests() {
  const browser = await puppeteer.launch()
  try {

    await compileTestApp({dir: __dirname})
    const page = await browser.newPage()
    await page.goto(`file:///${__dirname}/dist/index.html`)

    {
      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim())
        .to.equal(`Left is 42, right is 21. Decrement 42 Increment Decrement 21 Increment`)
    }

    // Structure of HTML
    {
      const roots = await page.evaluate(() => {
        return Array.from(document.body.children).map(({tagName}) => tagName)
      })
      const counter1 = await page.evaluate(() => {
        return Array.from(document.querySelector(`body > counter-cmp:nth-of-type(1)`)!.children)
          .map(({tagName}) => tagName)
      })
      const counter2 = await page.evaluate(() => {
        return Array.from(document.querySelector(`body > counter-cmp:nth-of-type(2)`)!.children)
          .map(({tagName}) => tagName)
      })
      expect(roots).to.eql([`SCRIPT`, `P`, `COUNTER-CMP`, `COUNTER-CMP`])
      expect(counter1).to.eql([`BUTTON`, `SPAN`, `BUTTON`])
      expect(counter2).to.eql([`BUTTON`, `SPAN`, `BUTTON`])
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }

}
