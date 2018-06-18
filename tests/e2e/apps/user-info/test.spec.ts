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
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`User info Name John Doe Edit Age 42 Edit`)
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }

}
