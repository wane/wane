// @ts-ignore
@component({
  template: `
    <button type="button" (click)="change(-1)">
      -
    </button>
    
    <span>
      {{ value }}
    </span>
    
    <button type="button" (click)="change(+1)">
      +
    </button>
  `
})
export default class {

  value = 21

  change (delta: number) {
    this.value += delta
  }

}
