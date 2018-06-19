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

    // HTML structure when no dialog is open
    {
      const body = await page.evaluate(() => {
        return Array.from(document.body.children)
          .map(({ tagName }) => tagName)
      })
      const dl = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl`)!.children)
          .map(({ tagName }) => tagName)
      })
      const firstDd = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl > dd:first-of-type`)!.children)
          .map(({ tagName }) => tagName)
      })
      const secondDd = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl > dd:last-of-type`)!.children)
          .map(({ tagName }) => tagName)
      })
      expect(body).to.eql([`SCRIPT`, `H1`, `DL`])
      expect(dl).to.eql([`DT`, `DD`, `DT`, `DD`])
      expect(firstDd).to.eql([`SPAN`, `BUTTON`])
      expect(secondDd).to.eql([`SPAN`, `BUTTON`])
    }

    // aria-label and type on both buttons
    {
      const firstButtonAria = await page.evaluate(() => {
        const el = document.querySelector(`dl > dd:first-of-type > button`) as HTMLButtonElement
        return el.getAttribute('aria-label')
      })
      const secondButtonAria = await page.evaluate(() => {
        const el = document.querySelector(`dl > dd:last-of-type > button`) as HTMLButtonElement
        return el.getAttribute('aria-label')
      })
      const firstType = await page.evaluate(() => {
        const el = document.querySelector(`dl > dd:first-of-type > button`) as HTMLButtonElement
        return el.type
      })
      const secondType = await page.evaluate(() => {
        const el = document.querySelector(`dl > dd:last-of-type > button`) as HTMLButtonElement
        return el.type
      })
      expect(firstButtonAria).to.eql(`Edit name`)
      expect(secondButtonAria).to.eql(`Edit age`)
      expect(firstType).to.eql(`button`)
      expect(secondType).to.eql(`button`)
    }

    // Clicking on name "Edit" to open the dialog, check basic structure
    {
      await page.click(`dl > dd:first-of-type > button`)
      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`User info Name John Doe Edit Age 42 Edit Change name Save`)
    }

    // New structure of the page
    {
      const body = await page.evaluate(() => {
        return Array.from(document.body.children)
          .map(({ tagName }) => tagName)
      })
      const dl = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl`)!.children)
          .map(({ tagName }) => tagName)
      })
      const firstDd = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl > dd:first-of-type`)!.children)
          .map(({ tagName }) => tagName)
      })
      const secondDd = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl > dd:last-of-type`)!.children)
          .map(({ tagName }) => tagName)
      })
      const textBoxEditCmp = await page.evaluate(() => {
        return Array.from(document.querySelector(`text-box-edit-cmp`)!.children)
          .map(({ tagName }) => tagName)
      })
      const form = await page.evaluate(() => {
        return Array.from(document.querySelector(`form`)!.children)
          .map(({ tagName }) => tagName)
      })
      expect(body).to.eql([`SCRIPT`, `H1`, `DL`, `TEXT-BOX-EDIT-CMP`])
      expect(dl).to.eql([`DT`, `DD`, `DT`, `DD`])
      expect(firstDd).to.eql([`SPAN`, `BUTTON`])
      expect(secondDd).to.eql([`SPAN`, `BUTTON`])
      expect(textBoxEditCmp).to.eql([`H2`, `FORM`])
      expect(form).to.eql([`INPUT`, `BUTTON`])
    }

    // Props on input and button
    {
      const { inputValue, inputType } = await page.evaluate(() => {
        const inputEl = document.querySelector(`form > input`) as HTMLInputElement
        return {
          inputValue: inputEl.value,
          inputType: inputEl.type,
        }
      })
      const buttonType = await page.evaluate(() => {
        const el = document.querySelector(`form > button`) as HTMLButtonElement
        return el.type
      })
      expect(inputValue).to.eql(`John Doe`)
      expect(inputType).to.eql('text')
      expect(buttonType).to.eql('submit')
    }

    // Deleting one letter form the input should do exactly that
    // (we test this because it actually does DOM prop update)
    {
      await page.focus(`form > input`)
      await page.keyboard.press('Backspace')
      const inputValue = await page.evaluate(() => {
        const el = document.querySelector('form > input') as HTMLInputElement
        return el.value
      })
      expect(inputValue).to.eql(`John Do`)
    }

    // Deleting everything removes the "Save" button from the DOM
    {
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')

      const inputValue = await page.evaluate(() => {
        const el = document.querySelector('form > input') as HTMLInputElement
        return el.value
      })
      expect(inputValue).to.eql(``)

      const formChildren = await page.evaluate(() => {
        return Array.from(document.querySelector(`form`)!.children)
          .map(({ tagName }) => tagName)
      })
      expect(formChildren).to.eql([`INPUT`])
    }

    // Typing something again adds it back
    {
      await page.type('form > input', `Jane Doe`)

      const inputValue = await page.evaluate(() => {
        const el = document.querySelector('form > input') as HTMLInputElement
        return el.value
      })
      expect(inputValue).to.eql(`Jane Doe`)

      const formChildren = await page.evaluate(() => {
        return Array.from(document.querySelector(`form`)!.children)
          .map(({ tagName }) => tagName)
      })
      expect(formChildren).to.eql([`INPUT`, `BUTTON`])
    }

    // Clicking on save closes the form and updates the view
    {
      await page.click(`form > button`)

      const bodyChildren = await page.evaluate(() => {
        return Array.from(document.body.children)
          .map(({ tagName }) => tagName)
      })
      expect(bodyChildren).to.eql([`SCRIPT`, `H1`, `DL`])

      const name = await page.evaluate(() => {
        return document.querySelector(`dl > dd:first-of-type > span`)!.textContent
      })
      expect(name).to.eql(`Jane Doe`)
    }

    // Clicking on the "Edit" button for age opens the dialog
    {
      await page.click(`dl > dd:last-of-type > button`)
      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`User info Name Jane Doe Edit Age 42 Edit Change age Make a change to see the Save button. Close`)
    }

    // New structure of the page
    {
      const body = await page.evaluate(() => {
        return Array.from(document.body.children)
          .map(({ tagName }) => tagName)
      })
      const dl = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl`)!.children)
          .map(({ tagName }) => tagName)
      })
      const firstDd = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl > dd:first-of-type`)!.children)
          .map(({ tagName }) => tagName)
      })
      const secondDd = await page.evaluate(() => {
        return Array.from(document.querySelector(`dl > dd:last-of-type`)!.children)
          .map(({ tagName }) => tagName)
      })
      const textBoxEditCmp = await page.evaluate(() => {
        return Array.from(document.querySelector(`number-box-edit-cmp`)!.children)
          .map(({ tagName }) => tagName)
      })
      const textBoxEditCmpSpan = await page.evaluate(() => {
        return Array.from(document.querySelector(`number-box-edit-cmp > span`)!.children)
          .map(({ tagName }) => tagName)
      })
      expect(body).to.eql([`SCRIPT`, `H1`, `DL`, `NUMBER-BOX-EDIT-CMP`])
      expect(dl).to.eql([`DT`, `DD`, `DT`, `DD`])
      expect(firstDd).to.eql([`SPAN`, `BUTTON`])
      expect(secondDd).to.eql([`SPAN`, `BUTTON`])
      expect(textBoxEditCmp).to.eql([`H2`, `INPUT`, `SPAN`, `BUTTON`])
      expect(textBoxEditCmpSpan).to.eql([`B`])
    }

    // Changing the number input works as expected
    {
      await page.focus('input[type=number]')
      await page.keyboard.press('ArrowUp')

      const inputValue = await page.evaluate(() => {
        const el = document.querySelector('input[type=number]') as HTMLInputElement
        return el.value
      })

      expect(inputValue).to.eql(`43`)
    }

    // This also removes the spam from the dom and adds a button
    {
      await page.click(`dl > dd:last-of-type > button`)
      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`User info Name Jane Doe Edit Age 42 Edit Change age Save Close`)

      const textBoxEditCmp = await page.evaluate(() => {
        return Array.from(document.querySelector(`number-box-edit-cmp`)!.children)
          .map(({ tagName }) => tagName)
      })
      expect(textBoxEditCmp).to.eql([`H2`, `INPUT`, `BUTTON`, `BUTTON`])
    }

    // Clicking on save returns the span instead of the button and updates the user info
    {
      await page.click(`number-box-edit-cmp > button:first-of-type`)
      const bodyInnerText = await page.evaluate(() => document.body.textContent)
      expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`User info Name Jane Doe Edit Age 43 Edit Change age Make a change to see the Save button. Close`)

      const textBoxEditCmp = await page.evaluate(() => {
        return Array.from(document.querySelector(`number-box-edit-cmp`)!.children)
          .map(({ tagName }) => tagName)
      })
      expect(textBoxEditCmp).to.eql([`H2`, `INPUT`, `SPAN`, `BUTTON`])
    }

    // Clicking on Close closes the dialog
    {
      await page.click(`number-box-edit-cmp > button:first-of-type`)

      // Basic structure
      {
        const bodyInnerText = await page.evaluate(() => document.body.textContent)
        expect(bodyInnerText.replace(/\s+/g, ' ').trim()).to.eql(`User info Name Jane Doe Edit Age 43 Edit`)
      }

      // HTML structure
      {
        const body = await page.evaluate(() => {
          return Array.from(document.body.children)
            .map(({ tagName }) => tagName)
        })
        const dl = await page.evaluate(() => {
          return Array.from(document.querySelector(`dl`)!.children)
            .map(({ tagName }) => tagName)
        })
        const firstDd = await page.evaluate(() => {
          return Array.from(document.querySelector(`dl > dd:first-of-type`)!.children)
            .map(({ tagName }) => tagName)
        })
        const secondDd = await page.evaluate(() => {
          return Array.from(document.querySelector(`dl > dd:last-of-type`)!.children)
            .map(({ tagName }) => tagName)
        })
        expect(body).to.eql([`SCRIPT`, `H1`, `DL`])
        expect(dl).to.eql([`DT`, `DD`, `DT`, `DD`])
        expect(firstDd).to.eql([`SPAN`, `BUTTON`])
        expect(secondDd).to.eql([`SPAN`, `BUTTON`])
      }
    }

  } catch (e) {
    throw e
  } finally {
    await browser.close()
  }

}
