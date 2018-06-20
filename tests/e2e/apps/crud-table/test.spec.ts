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
      const rows = [
        `John Doe 42 Africa Edit Remove`,
        `Jane Doe 41 Antarctica Edit Remove`,
        `Don Joe 40 Asia Edit Remove`,
        `Donna Joe 39 Europe Edit Remove`,
      ]
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Name Age Continent ${rows.join(' ')} Add new`)
    }

    // Remove an item in the middle
    {
      await page.click('table > tr:nth-child(3) > td:nth-child(5) > button')

      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      const rows = [
        `John Doe 42 Africa Edit Remove`,
        `Don Joe 40 Asia Edit Remove`,
        `Donna Joe 39 Europe Edit Remove`,
      ]
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Name Age Continent ${rows.join(' ')} Add new`)
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }

}
