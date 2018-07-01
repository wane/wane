import { Entry, Register, Template } from 'wane'

@Template(`
  <button (click)="dec()">
    Decrement
  </button>
  
  <span>{{ value }}</span>
  
  <button (click)="inc()">
    Increment
  </button>
`)
export class CounterCmp {
  public value!: number

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
  <counter-cmp
    [value]="count"
    (valueChange)="onCountChange(#)"
  />
`)
export class AppCmp {
  private count = 42

  private onCountChange (newCount: number): void {
    this.count = newCount
  }
}
