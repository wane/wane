// @ts-ignore
import { Register, Template } from 'wane'

@Template(`
  {{ entry }} ({{ score }})
`)
export class ItemCmp {
  public entry!: string
  public score!: number
}

@Register(ItemCmp)
@Template(`
  <w:for let cat of cats>
    <item-cmp
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
