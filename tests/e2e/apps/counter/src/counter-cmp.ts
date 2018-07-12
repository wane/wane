// @ts-ignore
import { Template } from 'wane'

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

  // TODO: change when we implement formatters
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
