import * as fs from 'fs-extra'
import * as gzipSize from 'gzip-size'
import * as brotliSize from 'brotli-size'

export interface Size {
  raw: number
  gzip: number
  brotli: number
}

export default function getSizes (path: string): Size {
  const contents = fs.readFileSync(path, 'utf-8')
  const raw = contents.length
  const gzip = gzipSize.sync(contents, { level: 9 })
  const brotli = brotliSize.sync(contents)
  return { raw, gzip, brotli }
}
