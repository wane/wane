import { expectDomStructure, h, runTest } from '../../utils'
import { expect } from 'chai'
import { asyncRepeat, getValue } from '../../utils/puppeteer-utils'

interface DomParams {
  info: {
    name: string
    age: number
  }
  isChangeNameOn?: boolean
  isSaveNameVisible?: boolean
  isChangeAgeOn?: boolean
  isSaveAgeVisible?: boolean
}

function changeName (isSaveVisible: boolean) {
  return h('text-box-edit-cmp', [
    h.h2(`Change name`),
    h.form([
      h.input({ type: 'text' }),
      isSaveVisible ? h.button({ type: 'submit' }, [`Save`]) : null,
    ]),
  ])
}

function changeAge (isSaveVisible: boolean) {
  return h('number-box-edit-cmp', [
    h.h2(`Change age`),
    h.input({ type: 'number' }),
    !isSaveVisible
      ? h.span([
        `Make a change to see the `,
        h.b(`Save`),
        ` button.`,
      ])
      : h.button({ type: 'button' }, [`Save`]),
    h.button({ type: 'button' }, [`Close`]),
  ])
}

function dom ({
                info: { name, age },
                isChangeNameOn = false,
                isChangeAgeOn = false,
                isSaveNameVisible = false,
                isSaveAgeVisible = false,
              }: DomParams) {
  return h.body([
    h.script({ src: 'index.js' }),
    h.h1(`User info`),
    h.dl([
      h.dt(`Name`),
      h.dd([
        h.span(name),
        h.button({ 'aria-label': `Edit name`, type: 'button' }, [`Edit`]),
      ]),
      h.dt(`Age`),
      h.dd([
        h.span(age.toString()),
        h.button({ 'aria-label': `Edit age`, type: 'button' }, [`Edit`]),
      ]),
    ]),
    isChangeNameOn ? changeName(isSaveNameVisible) : null,
    isChangeAgeOn ? changeAge(isSaveAgeVisible) : null,
  ])
}

export default async function runTests () {
  return runTest(__dirname, async page => {

    const testDom = (domParams: DomParams) => expectDomStructure(page, dom(domParams))

    // Initial structure of the page
    await testDom({ info: { name: `John Doe`, age: 42 } })

    // Clicking on name "Edit" to open the dialog, check basic structure
    await page.click(`dl > dd:first-of-type > button`)
    await testDom({ info: { name: `John Doe`, age: 42 }, isChangeNameOn: true, isSaveNameVisible: true })

    // Check the input's value in the newly opened dialog
    expect(await getValue(page, 'input')).to.equal(`John Doe`)

    // Deleting one letter form the input should do exactly that
    // (we test this because it actually does DOM prop update)
    await page.focus(`form > input`)
    await page.keyboard.press('Backspace')
    expect(await getValue(page, 'input')).to.equal(`John Do`)

    // Deleting everything removes the "Save" button from the DOM
    await asyncRepeat(`John Do`.length, () => page.keyboard.press('Backspace'))
    expect(await getValue(page, 'input')).to.eql(``)

    // Typing something again adds it back
    await page.type('form > input', `Jane Doe`)
    expect(await getValue(page, 'input')).to.eql(`Jane Doe`)

    // Clicking on save closes the form and updates the view
    await page.click(`form > button`)
    await testDom({ info: { name: `Jane Doe`, age: 42 } })

    // Clicking on the "Edit" button for age opens the dialog
    await page.click(`dl > dd:last-of-type > button`)
    await testDom({ info: { name: `Jane Doe`, age: 42 }, isChangeAgeOn: true })

    // The input field is pre-populated with current age
    expect(await getValue(page, 'input')).to.equal(`42`)

    // Changing the number input works as expected
    await page.focus('input')
    await page.keyboard.press('ArrowUp')
    await testDom({ info: { name: `Jane Doe`, age: 42 }, isChangeAgeOn: true, isSaveAgeVisible: true })
    expect(await getValue(page, 'input')).to.eql(`43`)

    // Clicking on save returns the span instead of the button and updates the user info
    await page.click(`number-box-edit-cmp > button:first-of-type`)
    await testDom({ info: { name: `Jane Doe`, age: 43 }, isChangeAgeOn: true })

    // Clicking on Close closes the dialog
    await page.click(`number-box-edit-cmp > button:first-of-type`)
    await testDom({ info: { name: `Jane Doe`, age: 43 } })

  })
}
