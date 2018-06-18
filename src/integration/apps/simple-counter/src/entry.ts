import { Entry, Template, Register } from 'wane'

@Template(`
  <span>{{ value }}</span>
  <button (click)="onIncClick()">Inc</button>
  <button (click)="onDecClick()">Dec</button>
`)
export class CounterCmp {

  public value!: number

  public valueChange (newVal: number) {
  }

  private onIncClick () {
    this.valueChange(this.value + 1)
  }

  private onDecClick () {
    this.valueChange(this.value - 1)
  }

}

@Entry()
@Register(CounterCmp)
@Template(`
  <counter-cmp
    [value]="counter"
    (valueChange)="onCounterChange(#)"  
  />
`)
export class EntryCmp {

  private counter: number = 21

  private onCounterChange(val: number): void {
    this.counter = val
  }

}
