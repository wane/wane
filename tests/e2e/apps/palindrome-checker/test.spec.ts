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
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Yup, it's a palindrome!`)
    }

    // HTML structure
    {
      const roots = await page.evaluate(() => {
        return Array.from(document.body.children).map(({ tagName }) => tagName)
      })
      expect(roots).to.eql([`SCRIPT`, `INPUT`, `B`])
    }

    // Typing one letter keeps that it is a palindrome ("a")
    {
      await page.focus(`body > input`)
      await page.type(`body > input`, `a`)
      const inputValue = await page.evaluate(() => {
        const inputEl = document.querySelector(`body > input`) as HTMLInputElement
        return inputEl.value
      })
      expect(inputValue).to.eql(`a`)

      const text = await page.evaluate(() => document.body.textContent)
      expect(text.replace(/\s+/g, ' ').trim()).to.eql(`Yup, it's a palindrome!`)
    }

    // The previous test did not remove focus from the input
    {
      const isInputFocused = await page.evaluate(() => {
        const inputEl = document.querySelector(`input`) as HTMLInputElement
        const activeElement = document.activeElement
        return inputEl == activeElement
      })
      expect(isInputFocused).to.eql(true)
    }

    // Typing another letter makes it not a palindrome ("ab")
    {
      await page.type(`input`, `b`)
      const inputValue = await page.evaluate(() => {
        const inputEl = document.querySelector(`input`) as HTMLInputElement
        return inputEl.value
      })
      expect(inputValue).to.eql(`ab`)

      const text = await page.evaluate(() => document.body.textContent)
      expect(text.replace(/\s+/g, ' ').trim()).to.eql(`Nah, this is not a palindrome.`)
    }

    // Typing yet another letter makes it a palindrome again ("aba")
    {
      await page.type(`input`, `a`)
      const inputValue = await page.evaluate(() => {
        const inputEl = document.querySelector(`body > input`) as HTMLInputElement
        return inputEl.value
      })
      expect(inputValue).to.eql(`aba`)

      const text = await page.evaluate(() => document.body.textContent)
      expect(text.replace(/\s+/g, ' ').trim()).to.eql(`Yup, it's a palindrome!`)
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }

}
