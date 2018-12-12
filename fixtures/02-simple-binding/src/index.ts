// @ts-ignore
@component({
  template: `
    <label>
      <span>Name</span>
      <input
        type="text"
        [value]="name"
        (input)="onChange(#)"
      >
    </label>
    
    <p>
      Welcome, {{ name }}!
    </p>
  `
})
export default class {

  name = ''

  onChange (event: Event) {
    const target = event.target as HTMLInputElement
    const { value } = target
    this.name = value
  }

}
