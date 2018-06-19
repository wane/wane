import * as puppeteer from 'puppeteer'
import { compileTestApp } from '../../utils'
import { expect } from 'chai'

export default async function runTests () {
  const browser = await puppeteer.launch()
  try {

    await compileTestApp({ dir: __dirname })
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
        return Array.from(document.body.children).map(({ tagName }) => tagName)
      })
      const counter1 = await page.evaluate(() => {
        return Array.from(document.querySelector(`body > counter-cmp:nth-of-type(1)`)!.children)
          .map(({ tagName }) => tagName)
      })
      const counter2 = await page.evaluate(() => {
        return Array.from(document.querySelector(`body > counter-cmp:nth-of-type(2)`)!.children)
          .map(({ tagName }) => tagName)
      })
      expect(roots).to.eql([`SCRIPT`, `P`, `COUNTER-CMP`, `COUNTER-CMP`])
      expect(counter1).to.eql([`BUTTON`, `SPAN`, `BUTTON`])
      expect(counter2).to.eql([`BUTTON`, `SPAN`, `BUTTON`])
    }

    // Decrement left, check if both places changed
    {
      await page.click(`counter-cmp:first-of-type > button:first-of-type`)
      const paragraph = await page.evaluate(() => {
        return document.querySelector(`p`)!.textContent
      })
      const left = await page.evaluate(() => {
        return document.querySelector(`counter-cmp:first-of-type > span`)!.textContent
      })
      expect(paragraph).to.eql(`Left is 41, right is 21.`)
      expect(left).to.eql(`41`)
    }

    // Increment left
    {
      await page.click(`counter-cmp:first-of-type > button:last-of-type`)
      const paragraph = await page.evaluate(() => {
        return document.querySelector(`p`)!.textContent
      })
      const left = await page.evaluate(() => {
        return document.querySelector(`counter-cmp:first-of-type > span`)!.textContent
      })
      expect(paragraph).to.eql(`Left is 42, right is 21.`)
      expect(left).to.eql(`42`)
    }

    // Decrement right
    {
      await page.click(`counter-cmp:last-of-type > button:first-of-type`)
      const paragraph = await page.evaluate(() => {
        return document.querySelector(`p`)!.textContent
      })
      const left = await page.evaluate(() => {
        return document.querySelector(`counter-cmp:last-of-type > span`)!.textContent
      })
      expect(paragraph).to.eql(`Left is 42, right is 20.`)
      expect(left).to.eql(`20`)
    }

    // Increment right
    {
      await page.click(`counter-cmp:last-of-type > button:last-of-type`)
      const paragraph = await page.evaluate(() => {
        return document.querySelector(`p`)!.textContent
      })
      const left = await page.evaluate(() => {
        return document.querySelector(`counter-cmp:last-of-type > span`)!.textContent
      })
      expect(paragraph).to.eql(`Left is 42, right is 21.`)
      expect(left).to.eql(`21`)
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }

}
