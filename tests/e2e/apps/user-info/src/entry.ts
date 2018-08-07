// @ts-ignore
import { Register, Template } from 'wane'

@Template(`
  <h2>{{ title }}</h2>
  <input type="number" [value]="value" (input)="onInput(#)">
  <w:if !isDirty>
    <span>Make a change to see the <b>Save</b> button.</span>  
  </w:if>
  <w:if isDirty>
    <button type="button" (click)="onSaveClick()">{{ saveText }}</button>
  </w:if>
  
  <button type="button" (click)="onCloseClick()">Close</button>
`)
export class NumberBoxEditCmp {
  public title: string = `Edit number`

  public saveText: string = 'Save'

  public value!: number

  private isDirty: boolean = false

  public valueChange (value: number) {
  }

  public close () {
  }

  private onInput (event: Event): void {
    const el = event.target as HTMLInputElement
    const { value } = el
    this.value = Number.parseFloat(value)
    this.isDirty = true
  }

  private onSaveClick (): void {
    this.valueChange(this.value)
    this.isDirty = false
  }

  private onCloseClick (): void {
    this.close()
  }
}

@Template(`
  <h2>{{ title }}</h2>
  <form (submit)="onSubmit(#)">
    <input
      type="text"
      [value]="value"
      (input)="onInput(#)"
    >
    
    <w:if !isEmpty>
      <button type="submit">Save</button>
    </w:if>
  </form>
`)
export class TextBoxEditCmp {
  public title: string = `Edit text`

  public value!: string

  public valueChange (newValue: string): void {
  }

  private get isEmpty (): boolean {
    return this.value == null || this.value == ''
  }

  private onInput (event: Event): void {
    const el = event.target as HTMLInputElement
    const { value } = el
    this.value = value
  }

  private onSubmit (event: Event): void {
    event.preventDefault()
    this.valueChange(this.value)
  }
}

@Register(TextBoxEditCmp, NumberBoxEditCmp)
@Template(`
  <h1>User info</h1>
  <dl>
    <dt>Name</dt>
    <dd>
      <span>{{ user.name }}</span>
      <button
        type="button"
        aria-label="Edit name"
        (click)="onEditNameClick()"
      >
        Edit
      </button>
    </dd>
    <dt>Age</dt>
    <dd>
      <span>{{ user.age }}</span>
      <button
        type="button"
        aria-label="Edit age"
        (click)="onEditAgeClick()"
      >
        Edit
      </button>
    </dd>  
  </dl>
  
  <w:if isEditNameFormOpen>
    <TextBoxEditCmp
      [title]="'Change name'"
      [value]="user.name"
      (valueChange)="onNameChange(#)"
    />
  </w:if>
  
  <w:if isEditAgeFormOpen>
    <NumberBoxEditCmp
      [title]="'Change age'"
      [value]="user.age"
      (valueChange)="onAgeChange(#)"
      (close)="onAgeClose()"
    />
  </w:if>
`)
export default class App {

  private user = {
    name: 'John Doe',
    age: 42,
  }

  private isEditNameFormOpen: boolean = false
  private isEditAgeFormOpen: boolean = false

  private onEditNameClick (): void {
    this.isEditNameFormOpen = true
  }

  private onEditAgeClick (): void {
    this.isEditAgeFormOpen = true
  }

  private onNameChange(newName: string): void {
    this.user = {
      ...this.user,
      name: newName,
    }
    this.isEditNameFormOpen = false
  }

  private onAgeChange(newAge: number): void {
    this.user = {
      ...this.user,
      age: newAge,
    }
  }

  private onAgeClose(): void {
    this.isEditAgeFormOpen = false
  }

}
