import * as puppeteer from 'puppeteer'
import { compileTestApp } from '../../utils'
import { expect } from 'chai'

export default async function runTests () {
  const browser = await puppeteer.launch()
  try {
    await compileTestApp({dir: __dirname})
    const page = await browser.newPage()
    await page.goto(`file:///${__dirname}/dist/index.html`)
    const bodyInnerText = await page.evaluate(() => document.body.innerText)
    expect(bodyInnerText).to.equal(`Hello World!`)
  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }
}
