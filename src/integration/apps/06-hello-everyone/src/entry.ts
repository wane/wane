// @ts-ignore
import { Template } from 'wane'

@Template(`
  <w:for person of people>
    <div>{{ greeting }}, {{ person }}!</div>
  </w:for>
`)
export default class App {
  public greeting: string = `Hello`
  public people: string[] = [`Alice`, `Bob`, `Cyndy`, `Derek`, `Eve`]
}
