import * as puppeteer from 'puppeteer'
import { compileTestApp } from '../../utils'
import { expect } from 'chai'

export default async function runTests () {
  const browser = await puppeteer.launch()
  try {

    await compileTestApp({dir: __dirname})
    const page = await browser.newPage()
    await page.goto(`file:///${__dirname}/dist/index.html`)

    {
      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.equal(`Decrement 42 Increment`)
    }

    // Structure of HTML
    {
      const roots = await page.evaluate(() => {
        return Array.from(document.body.children).map(({tagName}) => tagName)
      })
      const counter = await page.evaluate(() => {
        return Array.from(document.querySelector(`body > counter-cmp`)!.children)
          .map(({tagName}) => tagName)
      })

      expect(roots).to.eql([`SCRIPT`, `COUNTER-CMP`])
      expect(counter).to.eql([`BUTTON`, `SPAN`, `BUTTON`])
    }

    // Initial value
    {
      const count = await page.evaluate(() => {
        return document.querySelector(`body > counter-cmp > span`)!.textContent
      })
      expect(count).to.eql(`42`)
    }

    // Decrementing
    {
      await page.click(`body > counter-cmp > button:nth-child(1)`)
      const count = await page.evaluate(() => {
        return document.querySelector(`body > counter-cmp > span`)!.textContent
      })
      expect(count).to.eql(`41`)
    }

    // Incrementing
    {
      await page.click(`body > counter-cmp > button:nth-child(3)`)
      const count = await page.evaluate(() => {
        return document.querySelector(`body > counter-cmp > span`)!.textContent
      })
      expect(count).to.eql(`42`)
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }
}
