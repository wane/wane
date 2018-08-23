// @ts-ignore
import { Register, Style, Template } from 'wane'
import { TodoItem } from '../types'

@Template(`
  <input
    type="text"
    aria-label="Change text"
    [value]="value"
    (input)="onChange(#)"
    (keydown)="onKeyDown(#)"
  >
`)
class Edit {

  public item!: TodoItem

  public submit (newName: string | null) {
  }

  private value: string = ''

  private onChange (event: KeyboardEvent): void {
    const $input = event.target as HTMLInputElement
    const { value } = $input
    this.value = value
  }

  private onKeyDown (event: KeyboardEvent): void {
    if (event.key == 'Enter') {
      event.preventDefault()
      this.submit(this.value)
    } else if (event.key == 'Escape') {
      event.preventDefault()
      this.submit(null)
    }
  }

}

@Register(Edit)
@Style(`
  .complete {
  
    span {
      text-decoration: line-through;
    }
  }
`)
@Template(`
  <Edit [w:if]="isEditMode" [item]="item" (submit)="onEditSubmit(#)"/>
  <div [w:if]="!isEditMode" [className]="className">
    <span>{{ item.text }}</span>
    <button (click)="toggle()">{{ toggleText }}</button>
    <button (click)="onEditClick()" [w:if]="!item.isCompleted">Edit</button>
  </div>
`)
export default class Item {

  public item!: TodoItem

  public toggle () {
  }

  public edit (data: { id: number, text: string }) {
  }

  private isEditMode = false

  private get toggleText () {
    return this.item.isCompleted ? `Undo` : `Done`
  }

  private get className () {
    return this.item.isCompleted ? 'complete' : ''
  }

  private onEditClick (): void {
    this.isEditMode = true
  }

  private onEditSubmit (text: string | null): void {
    this.isEditMode = false
    if (text != null) {
      const data = { id: this.item.id, text }
      this.edit(data)
    }
  }

}
