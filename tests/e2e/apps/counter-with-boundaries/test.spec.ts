import * as puppeteer from 'puppeteer'
import { compileTestApp } from '../../utils'
import { expect } from 'chai'

async function getInfo (page: puppeteer.Page) {
  return await page.evaluate(() => {
    const count = document.querySelector(`body > counter-cmp > span`)!
    const minusTen = document.querySelector(`body > counter-cmp > button:nth-of-type(1)`)! as HTMLButtonElement
    const minusOne = document.querySelector(`body > counter-cmp > button:nth-of-type(2)`)! as HTMLButtonElement
    const plusOne = document.querySelector(`body > counter-cmp > button:nth-of-type(3)`)! as HTMLButtonElement
    const plusTen = document.querySelector(`body > counter-cmp > button:nth-of-type(4)`)! as HTMLButtonElement
    return {
      count: count.textContent,
      isDisabled: {
        minusTen: minusTen.disabled,
        minusOne: minusOne.disabled,
        plusOne: plusOne.disabled,
        plusTen: plusTen.disabled,
      },
    }
  })
}

export default async function runTests () {
  const browser = await puppeteer.launch()
  try {
    await compileTestApp({ dir: __dirname })
    const page = await browser.newPage()
    await page.goto(`file:///${__dirname}/dist/index.html`)

    // Structure of HTML
    {
      const roots = await page.evaluate(() => {
        return Array.from(document.body.children).map(({ tagName }) => tagName)
      })
      const counter = await page.evaluate(() => {
        return Array.from(document.querySelector(`body > counter-cmp`)!.children)
          .map(({ tagName }) => tagName)
      })

      expect(roots).to.eql([`SCRIPT`, `COUNTER-CMP`])
      expect(counter).to.eql([`BUTTON`, `BUTTON`, `BUTTON`, `BUTTON`, `SPAN`])
    }

    // Initial value and button states
    {
      const elements = await getInfo(page)
      expect(elements.count).to.eql(`25`)
      expect(elements.isDisabled.minusTen).to.eql(false)
      expect(elements.isDisabled.minusOne).to.eql(false)
      expect(elements.isDisabled.plusOne).to.eql(false)
      expect(elements.isDisabled.plusTen).to.eql(false)
    }

    // Disabled plus ten (at 45)
    {
      await page.click(`body > counter-cmp > button:nth-of-type(4)`)
      await page.click(`body > counter-cmp > button:nth-of-type(4)`)
      const elements = await getInfo(page)
      expect(elements.count).to.eql(`45`)
      expect(elements.isDisabled.minusTen).to.eql(false)
      expect(elements.isDisabled.minusOne).to.eql(false)
      expect(elements.isDisabled.plusOne).to.eql(false)
      expect(elements.isDisabled.plusTen).to.eql(true)
    }

    // Disabled plus ten and plus one (at 50)
    {
      await page.click(`body > counter-cmp > button:nth-of-type(3)`)
      await page.click(`body > counter-cmp > button:nth-of-type(3)`)
      await page.click(`body > counter-cmp > button:nth-of-type(3)`)
      await page.click(`body > counter-cmp > button:nth-of-type(3)`)
      await page.click(`body > counter-cmp > button:nth-of-type(3)`)
      const elements = await getInfo(page)
      expect(elements.count).to.eql(`50`)
      expect(elements.isDisabled.minusTen).to.eql(false)
      expect(elements.isDisabled.minusOne).to.eql(false)
      expect(elements.isDisabled.plusOne).to.eql(true)
      expect(elements.isDisabled.plusTen).to.eql(true)
    }

    // Disabled minus ten and minus one (at 0)
    {
      await page.click(`body > counter-cmp > button:nth-of-type(1)`)
      await page.click(`body > counter-cmp > button:nth-of-type(1)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(1)`)
      await page.click(`body > counter-cmp > button:nth-of-type(1)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      await page.click(`body > counter-cmp > button:nth-of-type(2)`)
      const elements = await getInfo(page)
      expect(elements.count).to.eql(`0`)
      expect(elements.isDisabled.minusTen).to.eql(true)
      expect(elements.isDisabled.minusOne).to.eql(true)
      expect(elements.isDisabled.plusOne).to.eql(false)
      expect(elements.isDisabled.plusTen).to.eql(false)
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }
}
