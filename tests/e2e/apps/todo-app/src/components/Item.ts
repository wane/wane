// @ts-ignore
import { Register, Style, Template } from 'wane'
import { TodoItem } from '../types'

@Template(`
  <input
    type="text"
    aria-label="Change text"
    [value]="value"
    (input)="onChange(#)"
  >
`)
class Edit {

  public item!: TodoItem

  public submit (newName: string | null) {
  }

  private value: string = ''

  private onChange (event: KeyboardEvent) {
    if (event.key == 'Enter') {
      event.preventDefault()
      this.submit(this.value)
      return
    }

    if (event.key == 'Escape') {
      event.preventDefault()
      this.submit(null)
      return
    }

    const $input = event.target as HTMLInputElement
    const { value } = $input
    this.value = value
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
    <button (click)="onToggleClick()">{{ toggleText }}</button>
    <button (click)="onEditClick()" [w:if]="!item.isCompleted">Edit</button>
  </div>
`)
export default class Item {

  public item!: TodoItem

  public toggle () {
  }

  public edit (newText: string) {
  }

  private isEditMode = false

  private get toggleText () {
    return this.item.isCompleted ? `Undo` : `Done`
  }

  private get className () {
    return this.item.isCompleted ? 'complete' : undefined
  }

  private onToggleClick (): void {
    this.toggle()
  }

  private onEditClick (): void {
    this.isEditMode = true
  }

  private onEditSubmit (text: string | null): void {
    if (text == null) {
      this.isEditMode = false
      return
    }

    this.edit(text)
  }

}
