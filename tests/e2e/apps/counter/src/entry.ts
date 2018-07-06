// @ts-ignore
import { Entry, Register, Template } from 'wane'
import { CounterCmp } from './counter-cmp'

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
