import * as puppeteer from 'puppeteer'
import { expect } from 'chai'

export default async function crudTable (page: puppeteer.Page) {

  // Basic structure
  {
    const bodyInnerText = await page.evaluate(() => document.body.textContent)
    const rows = [
      `John Doe 42 Africa Edit Remove`,
      `Jane Doe 41 Antarctica Edit Remove`,
      `Don Joe 40 Asia Edit Remove`,
      `Donna Joe 39 Europe Edit Remove`,
    ]
    expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Name Age Continent Actions ${rows.join(' ')} Add new`)
  }

  // DOM details
  {
    const body = await page.evaluate(() => {
      return Array.from(document.body.children).map(({ tagName }) => tagName)
    })
    const table = await page.evaluate(() => {
      return Array.from(document.querySelector('table')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr1 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(1)')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr2 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(2)')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr3 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(3)')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr4 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(4)')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr5 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(5)')!.children)
        .map(({ tagName }) => tagName)
    })

    expect(body).to.eql(['SCRIPT', 'TABLE', 'BUTTON'])
    expect(table).to.eql(['TR', 'TR', 'TR', 'TR', 'TR'])
    expect(tr1).to.eql(['TH', 'TH', 'TH', 'TH'])
    expect(tr2).to.eql(['TD', 'TD', 'TD', 'TD', 'TD'])
    expect(tr3).to.eql(['TD', 'TD', 'TD', 'TD', 'TD'])
    expect(tr4).to.eql(['TD', 'TD', 'TD', 'TD', 'TD'])
    expect(tr5).to.eql(['TD', 'TD', 'TD', 'TD', 'TD'])
  }

  // DOM details
  {
    const body = await page.evaluate(() => {
      return Array.from(document.body.children).map(({ tagName }) => tagName)
    })
    const table = await page.evaluate(() => {
      return Array.from(document.querySelector('table')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr1 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(1)')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr2 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(2)')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr3 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(3)')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr4 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(4)')!.children)
        .map(({ tagName }) => tagName)
    })
    const tr5 = await page.evaluate(() => {
      return Array.from(document.querySelector('table tr:nth-child(5)')!.children)
        .map(({ tagName }) => tagName)
    })

    expect(body).to.eql(['SCRIPT', 'TABLE', 'BUTTON'])
    expect(table).to.eql(['TR', 'TR', 'TR', 'TR', 'TR'])
    expect(tr1).to.eql(['TH', 'TH', 'TH', 'TH'])
    expect(tr2).to.eql(['TD', 'TD', 'TD', 'TD', 'TD'])
    expect(tr3).to.eql(['TD', 'TD', 'TD', 'TD', 'TD'])
    expect(tr4).to.eql(['TD', 'TD', 'TD', 'TD', 'TD'])
    expect(tr5).to.eql(['TD', 'TD', 'TD', 'TD', 'TD'])
  }

  // Remove an item in the middle
  {
    await page.click('table tr:nth-child(3) > td:nth-child(5) > button')

    const bodyInnerText = await page.evaluate(() => document.body.textContent)
    const rows = [
      `John Doe 42 Africa Edit Remove`,
      `Don Joe 40 Asia Edit Remove`,
      `Donna Joe 39 Europe Edit Remove`,
    ]
    expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`Name Age Continent Actions ${rows.join(' ')} Add new`)
  }

}
