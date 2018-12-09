// @ts-ignore
@component({
  template: `
    <button type="button" (click)="onChange(-1)"> - </button>
    <span> {{ value }} </span>
    <button type="button" (click)="onChange(+1)"> + </button>
  `
})
class Counter {
  // @ts-ignore
  @input value

  // @ts-ignore
  @output change (value: number) { }

  private onChange (delta: number) {
    this.change(this.value + delta)
  }
}


// @ts-ignore
@Component({
  register: [Counter],
  template: `
    <Counter [value]="value" (change)="change(#)"/>
  `
})
export default class {
  value = 21
  change (value: number) {
    this.value = value
  }
}
