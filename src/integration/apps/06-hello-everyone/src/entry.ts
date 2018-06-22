// @ts-ignore
import { Entry, Template } from 'wane'

@Entry()
@Template(`
  <w:for person of people>
    <div>{{ greeting }}, {{ person }}!</div>
  </w:for>
`)
export class App {
  public greeting: string = `Hello`
  public people: string[] = [`Alice`, `Bob`, `Cyndy`, `Derek`, `Eve`]
}
