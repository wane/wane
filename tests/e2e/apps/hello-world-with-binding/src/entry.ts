import { Entry, Template } from 'wane'

@Entry()
@Template(`
  <p>Hello, {{ name }}!</p>
  
  <label>
    <span>Name</span>
    <input type="text" [value]="name" (input)="onNameChange(#)">
  </label>
`)
export class MainCmp {
  private name: string = 'World'
  private onNameChange(event: Event) {
    const target = event.target as HTMLInputElement
    this.name = target.value
  }
}
