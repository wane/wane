// @ts-ignore
import { Register, Template } from 'wane'

@Template(`
  {{ entry }} ({{ score }})
`)
export class Item {
  public entry!: string
  public score!: number
}

@Register(Item)
@Template(`
  <w:for let cat of cats>
    <Item
      [entry]="cat.name"
      [score]="cat.cutenessLevel"
    />
  </w:for>
`)
export default class App {
  public cats = [
    { name: `Leo`, cutenessLevel: 10 },
    { name: `Ralph`, cutenessLevel: 6 },
    { name: `Donnie`, cutenessLevel: 2 },
    { name: `Mikey`, cutenessLevel: 1 },
  ]
}
