import * as puppeteer from 'puppeteer'
import { compileTestApp } from '../../utils'
import { expect } from 'chai'

export default async function runTests () {
  const browser = await puppeteer.launch()
  try {

    await compileTestApp({ dir: __dirname })
    const page = await browser.newPage()
    await page.goto(`file:///${__dirname}/dist/index.html`)

    // Basic structure
    {
      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Number of elements Update First 5 Fibonacci numbers 1 2 3 5 8`)
    }

    // Updating to 6
    {
      await page.focus('input')
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('Enter')

      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Number of elements Update First 6 Fibonacci numbers 1 2 3 5 8 13`)
    }

    // Updating back to 5
    {
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')

      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Number of elements Update First 5 Fibonacci numbers 1 2 3 5 8`)
    }

    // Updating to 10
    {
      await page.keyboard.press('Backspace')
      await page.type('input', `10`)
      await page.keyboard.press('Enter')

      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Number of elements Update First 10 Fibonacci numbers 1 2 3 5 8 13 21 34 55 89`)
    }

    // Updating to 0
    {
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.type('input', `0`)
      await page.keyboard.press('Enter')

      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Number of elements Update First 0 Fibonacci numbers`)
    }

    // Updating to 1
    {
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('Enter')

      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Number of elements Update First 1 Fibonacci numbers 1`)
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }

}
