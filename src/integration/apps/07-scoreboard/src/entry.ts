// @ts-ignore
import { Entry, Register, Template } from 'wane'

@Template(`
  {{ entry }} ({{ score }})
`)
export class ItemCmp {
  public entry!: string
  public score!: number
}

@Entry()
@Register(ItemCmp)
@Template(`
  <w:for let cat of cats>
    <item-cmp
      [entry]="cat.name"
      [score]="cat.cutenessLevel"
    />
  </w:for>
`)
export class App {
  public cats = [
    { name: `Leo`, cutenessLevel: 10 },
    { name: `Ralph`, cutenessLevel: 6 },
    { name: `Donnie`, cutenessLevel: 2 },
    { name: `Mikey`, cutenessLevel: 1 },
  ]
}
