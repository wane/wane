// @ts-ignore
import { Register, Template } from 'wane'

let id: number = 1001

export interface Item {
  id: number
  name: string
  age: number
  continent: string
}

@Template(`
  No entered data. <button (click)="createNew()">Add some!</button>
`)
export class EmptyState {
  public createNew () {
  }
}

@Template(`
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
            [w:for]="continent of listOfContinents"
            [value]="continent"
          >
            {{ continent }}
          </option>
      </select>
    </label>
    <button type="submit">Save</button>
    <button type="button" (click)="close()">Cancel</button>
  </form>
`)
export class Form {

  private listOfContinents = [`Africa`, `Antarctica`, `Asia`, `Europe`, `North America`, `Oceania`, `South America`]

  public initialValue!: Item

  private onSubmit (event: Event) {
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

  public submit (value: Item): void {
  }

  public close(): void {
  }

}

@Register(EmptyState, Form)
@Template(`
  <w:if isDataEmpty>
    <EmptyState (createNew)="onCreateNewClick()"/>
  </w:if>
  
  <w:if !isDataEmpty>
    <table>
      <tr>
        <th>Name</th>
        <th>Age</th>
        <th>Continent</th>
        <th [attr.colspan]="'2'">Actions</th>
      </tr>
      <w:for (item, index) of data; key: id>
        <tr>
          <td>{{ item.name }}</td>
          <td>{{ item.age }}</td>
          <td>{{ item.continent }}</td>
          <td><button type="button" (click)="onEditClick(index)">Edit</button></td>
          <td><button type="button" (click)="onRemoveClick(index)">Remove</button></td>
        </tr>
      </w:for>
    </table>  
  </w:if>
  
  <button type="button" (click)="onCreateNewClick()">Add new</button>
  
  <Form
    [w:if]="isNewFormOpen"
    [initialValue]="itemSelectedForEdit"
    (submit)="add(#)"
    (close)="closeNewForm()"
  />
  
  <w:if isEditFormOpen>
    <Form [initialValue]="itemSelectedForEdit" (submit)="edit(#)" (close)="closeEditForm()"/>  
  </w:if>
`)
export default class App {

  private data: Item[] = [
    { id: id++, name: `John Doe`, age: 42, continent: `Africa` },
    { id: id++, name: `Jane Doe`, age: 41, continent: `Antarctica` },
    { id: id++, name: `Don Joe`, age: 40, continent: `Asia` },
    { id: id++, name: `Donna Joe`, age: 39, continent: `Europe` },
  ]

  private get isDataEmpty (): boolean {
    return this.data.length == 0
  }

  private indexOfItemSelectedForEdit: number = -1
  private itemSelectedForEdit: Item | undefined

  private isNewFormOpen: boolean = false
  private isEditFormOpen: boolean = false

  private openNewForm() {
    this.isNewFormOpen = true
  }

  private closeNewForm() {
    this.isNewFormOpen = false
  }

  private openEditForm() {
    this.isEditFormOpen = true
  }

  private closeEditForm() {
    this.isEditFormOpen = false
  }

  private onCreateNewClick (): void {
    this.itemSelectedForEdit = {
      id: id++,
      name: ``,
      age: 0,
      continent: '',
    }
    this.openNewForm()
  }

  private onEditClick (index: number): void {
    this.indexOfItemSelectedForEdit = index
    this.itemSelectedForEdit = { ...this.data[index] }
    this.openEditForm()
  }

  private onRemoveClick (index: number): void {
    this.remove(index)
  }

  private add (item: Item): void {
    this.data = [...this.data, item]
    this.closeNewForm()
  }

  private edit (item: Item): void {
    const oldItemIndex = this.data.findIndex(({id}) => id == item.id)
    const above = this.data.slice(0, oldItemIndex)
    const below = this.data.slice(oldItemIndex + 1)
    this.data = [...above, item, ...below]
    this.closeEditForm()
  }

  private remove(index: number): void {
    const above = this.data.slice(0, index)
    const below = this.data.slice(index + 1)
    this.data = [...above, ...below]
  }

}
