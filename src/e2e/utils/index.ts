import { compile, WaneCompilerOptions } from '../../compiler/compile'
import * as puppeteer from 'puppeteer'

async function compileTestApp (opts: Partial<WaneCompilerOptions>) {
  await compile({ pretty: true, ...opts })
}

export async function runTest (__dirname: string, test: (page: puppeteer.Page) => void): Promise<void> {
  let browser: puppeteer.Browser | undefined
  try {
    browser = await puppeteer.launch()
    const dir = __dirname.replace('/dist/', '/src/')
    await compileTestApp({ dir })
    const page = await browser.newPage()
    await page.goto(`file:///${dir}/dist/index.html`)
    test(page)
    await browser.close()
  } catch (e) {
    if (browser != null) {
      await browser.close()
    }
    // throw e
  }
}
