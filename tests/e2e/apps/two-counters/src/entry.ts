import { Entry, Register, Template } from 'wane'

@Template(`
  <button (click)="dec()">
    Decrement
  </button>
  
  <span>{{ valueString }}</span>
  
  <button (click)="inc()">
    Increment
  </button>
`)
export class CounterCmp {
  public value!: number

  private get valueString (): string {
    return this.value.toString()
  }

  public valueChange (value: number): void {
  }

  private inc () {
    this.valueChange(this.value + 1)
  }

  private dec () {
    this.valueChange(this.value - 1)
  }
}

@Entry()
@Register(CounterCmp)
@Template(`
  <p>Left is {{ leftString }}, right is {{ rightString }}.</p>

  <counter-cmp
    [value]="left"
    (valueChange)="onLeftChange(#)"
  />
  
  <counter-cmp
    [value]="right"
    (valueChange)="onRightChange(#)"
  />
`)
export class AppCmp {
  private left = 42
  private right = 21

  private get leftString (): string {
    return this.left.toString()
  }

  private get rightString (): string {
    return this.right.toString()
  }

  private onLeftChange (val: number): void {
    this.left = val
  }

  private onRightChange (val: number): void {
    this.right = val
  }
}
