// @ts-ignore
import { Template, Register } from 'wane'

@Template(`
  <button (click)="dec()">Decrement</button>
  <span>{{ value }}</span>
  <button (click)="inc()">Increment</button>
`)
export class Counter {
  public value!: number

  public valueChange (value: number) {
  }

  private inc () {
    this.valueChange(this.value + 1)
  }

  private dec () {
    this.valueChange(this.value - 1)
  }
}

@Register(Counter)
@Template(`
  <Counter
    [value]="count"
    (valueChange)="onCountChange(#)"
  />
`)
export default class App {
  private count: number = 21

  private onCountChange (newCount: number): void {
    this.count = newCount
  }
}
