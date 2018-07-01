import * as puppeteer from 'puppeteer'
import { expect } from 'chai'

export default async function runTests (page: puppeteer.Page) {

  {
    const contents = await page.evaluate(() => {
      return Array.from(document.body.children)
        .map(element => element.tagName)
    })
    expect(contents).to.eql([`SCRIPT`, `P`, `LABEL`])
  }

  {
    const paragraphText = await page.evaluate(() => {
      return document.querySelector('p')!.innerText
    })
    expect(paragraphText).to.eql(`Hello, World!`)
  }

  {
    const labelContents = await page.evaluate(() => {
      return Array.from(document.querySelector('body > label')!.children)
        .map(element => element.tagName)
    })
    expect(labelContents).to.eql([`SPAN`, `INPUT`])
  }

  {
    const labelSpanText = await page.evaluate(() => {
      return document.querySelector(`body > label > span`)!.textContent
    })
    expect(labelSpanText).to.eql(`Name`)
  }

  {
    const inputProps = await page.evaluate(() => {
      const input = document.querySelector(`body > label > input`) as HTMLInputElement
      return {
        type: input.type,
        value: input.value,
      }
    })
    expect(inputProps).to.eql({ type: 'text', value: 'World' })
  }

  {
    await page.focus(`body > label > input`)
    await page.type(`body > label > input`, `foo`)
    const inputValue = await page.evaluate(() => {
      const inputEl = document.querySelector(`body > label > input`) as HTMLInputElement
      return inputEl.value
    })
    expect(inputValue).to.eql(`Worldfoo`)

    const paragraphContent = await page.evaluate(() => {
      const p = document.querySelector(`body > p`) as HTMLParagraphElement
      return p.textContent
    })
    expect(paragraphContent).to.eql(`Hello, Worldfoo!`)
  }

}
