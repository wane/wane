import { Entry, Register, Template } from 'wane'

export interface Item {
  name: string
  age: number
  continent: string
}

@Template(`
  No entered data. <button (click)="createNew()">Add some!</button>
`)
export class EmptyStateCmp {
  public createNew () {
  }
}

@Template(`
  <form (submit)="onSubmit(#)">
    <label>
      <span>Name</span>
      <input type="text" [value]="initialValue.name">
    </label>
    <label>
      <span>Age</span>
      <input type="number" [value]="initialValue.age">    
    </label>
    <label>
      <span>Continent</span>
      <select [value]="initialValue.continent">
        <option value="">Unknown</option>
        <w:for continent of listOfContinents>
          <option [value]="continent">{{ continent }}</option>
        </w:for>
      </select>
    </label>
    <button type="submit">Save</button>
    <button type="button" (click)="close()">Cancel</button>
  </form>
`)
export class FormCmp {

  private listOfContinents = [`Africa`, `Antarctica`, `Asia`, `Europe`, `North America`, `Oceania`, `South America`]

  public initialValue!: Item

  private onSubmit (event: Event) {
    event.preventDefault()
  }

  public submit (value: any): void {
  }

  public close(): void {
  }

}

@Entry()
@Register(EmptyStateCmp, FormCmp)
@Template(`
  <w:if isDataEmpty>
    <empty-state-cmp (createNew)="onCreateNewClick()"/>
  </w:if>
  
  <w:if !isDataEmpty>
    <table>
      <tr>
        <th>Name</th>
        <th>Age</th>
        <th>Continent</th>
        <th colspan="2"></th>
      </tr>
      <w:for (item, index) of data>
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
  
  <w:if isNewFormOpen>
    <form-cmp [initialValue]="itemSelectedForEdit" (submit)="add(#)" (close)="closeNewForm()"/>
  </w:if>
  
  <w:if isEditFormOpen>
    <form-cmp [initialValue]="itemSelectedForEdit" (submit)="edit(#)" (close)="closeEditForm()"/>  
  </w:if>
`)
export class App {

  private data: Item[] = [
    { name: `John Doe`, age: 42, continent: `Africa` },
    { name: `Jane Doe`, age: 41, continent: `Antarctica` },
    { name: `Don Joe`, age: 40, continent: `Asia` },
    { name: `Donna Joe`, age: 39, continent: `Europe` },
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

  private edit (index: number, item: Item): void {
    const above = this.data.slice(0, index)
    const below = this.data.slice(index + 1)
    this.data = [...above, item, ...below]
    this.closeEditForm()
  }

  private remove(index: number): void {
    const above = this.data.slice(0, index)
    const below = this.data.slice(index + 1)
    this.data = [...above, ...below]
  }

}
