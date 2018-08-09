// @ts-ignore
import { Template, Style } from 'wane'

@Template(`
  {{ message }}
`)
export default class HelloWorldCmp {
  private message = `Hello!`
}
