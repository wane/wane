import * as puppeteer from 'puppeteer'

export function getValue (page: puppeteer.Page, selector: string): Promise<string> {
  return page.evaluate((selector: string) => {
    const inputEl = document.querySelector(selector) as HTMLInputElement
    return inputEl.value
  }, selector)
}

export function getTextContent (page: puppeteer.Page, selector: string): Promise<string> {
  return page.evaluate((selector: string) => {
    const element = document.querySelector(selector)!
    return element.textContent
  }, selector)
}

export function isFocused (page: puppeteer.Page, selector: string): Promise<boolean> {
  return page.evaluate((selector: string) => {
    const inputEl = document.querySelector(selector) as HTMLInputElement
    const activeElement = document.activeElement
    return inputEl == activeElement
  }, selector)
}

export async function asyncRepeat (times: number, fn: (...args: any[]) => Promise<any>) {
  for (let i = 0; i < times; i++) {
    await fn()
  }
}
