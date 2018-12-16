// @ts-ignore
import { component, input, output } from 'wane'
import { Item } from './item'


@component({
  template: `
    <form (submit)="onSubmit(#)">
      <label>
        <span>Name</span>
        <input type="text" name="name" [value]="initialValue.name">
      </label>
      <label>
        <span>Age</span>
        <input type="number" name="age" [value]="initialValue.age">    
      </label>
      <label>
        <span>Continent</span>
        <select name="continent" [value]="initialValue.continent">
          <option value="">Unknown</option>
            <option
              [w-for]="const continent of listOfContinents"
              [value]="continent"
            >
              {{ continent }}
            </option>
        </select>
      </label>
      <button type="submit">Save</button>
      <button type="button" (click)="close()">Cancel</button>
    </form>
  `,
})
export default class Form {

  listOfContinents = [`Africa`, `Antarctica`, `Asia`, `Europe`, `North America`, `Oceania`, `South America`]

  @input initialValue!: Item

  @output close!: () => void

  @output submit!: (value: Item) => void

  onSubmit (event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const elements = form.elements

    const nameEl = elements.namedItem('name') as HTMLInputElement
    const name = nameEl.value

    const ageEl = elements.namedItem('age') as HTMLInputElement
    const age = Number.parseFloat(ageEl.value)

    const continentEl = elements.namedItem('continent') as HTMLInputElement
    const continent = continentEl.value

    const newItem: Item = {id: this.initialValue.id, name, age, continent}
    this.submit(newItem)
  }

}