// @ts-ignore
import { component, input, output } from 'wane'
import { Item } from './item'
import { id } from './unique-id'
import EmptyState from './empty-state'
import Form from './form'


@component({
  register: [EmptyState, Form],
  template: `
    <EmptyState
      [w-if]="isDataEmpty"
      (createNew)="onCreateNewClick()"
    />
    
    <table [w-if]="!isDataEmpty">
      <tr>
        <th>Name</th>
        <th>Age</th>
        <th>Continent</th>
        <th [attr.colspan]="'2'">Actions</th>
      </tr>
      <w-block
        [w-for]="const [index, item] of data"
        [w-key]="item.id"
      >
        <tr>
          <td>{{ item.name }}</td>
          <td>{{ item.age }}</td>
          <td>{{ item.continent }}</td>
          <td><button type="button" (click)="onEditClick(item)">Edit</button></td>
          <td><button type="button" (click)="onRemoveClick(item)">Remove</button></td>
        </tr>
      </w-block>
    </table>
    
    <button type="button" (click)="onCreateNewClick()">Add new</button>
  
    <Form
      [w-if]="isNewFormOpen"
      [initialValue]="itemSelectedForEdit"
      (submit)="onNewFormSubmit(#)"
      (close)="closeNewForm()"
    />
    
    <w-if isEditFormOpen>
      <Form [initialValue]="itemSelectedForEdit" (submit)="onEditFormSubmit(#)" (close)="closeEditForm()"/>  
    </w-if>
  `,
})
export default class App {

  data: Item[] = [
    {id: id(), name: `John Doe`, age: 42, continent: `Africa`},
    {id: id(), name: `Jane Doe`, age: 41, continent: `Antarctica`},
    {id: id(), name: `Don Joe`, age: 40, continent: `Asia`},
    {id: id(), name: `Donna Joe`, age: 39, continent: `Europe`},
  ]

  get isDataEmpty (): boolean { return this.data.length == 0 }

  selectedItem: Item | null = null
  isNewFormOpen: boolean = false
  isEditFormOpen: boolean = false

  openNewForm () { this.isNewFormOpen = true }

  closeNewForm () { this.isNewFormOpen = false }

  openEditForm () { this.isEditFormOpen = true }

  closeEditForm () { this.isEditFormOpen = false }

  onCreateNewClick () {
    this.selectedItem = {
      id: id(),
      name: ``,
      age: 0,
      continent: '',
    }
    this.openNewForm()
  }

  onEditClick (item: Item) {
    this.selectedItem = {...item}
    this.openEditForm()
  }

  onRemoveClick (item: Item) {
    this.remove(item)
  }

  onNewFormSubmit (item: Item) {
    this.add(item)
    this.closeNewForm()
  }

  onEditFormSubmit (item: Item) {
    this.edit(item)
    this.closeEditForm()
  }

  private add (item: Item) {
    this.data = [...this.data, item]
  }

  private edit (item: Item) {
    const oldItemIndex = this.data.findIndex(({id}) => id == item.id)
    const above = this.data.slice(0, oldItemIndex)
    const below = this.data.slice(oldItemIndex + 1)
    this.data = [...above, item, ...below]
  }

  private remove (item: Item) {
    const itemIndex = this.data.findIndex(({id}) => id == item.id)
    const above = this.data.slice(0, itemIndex)
    const below = this.data.slice(itemIndex + 1)
    this.data = [...above, ...below]
  }

}
