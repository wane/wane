// @ts-ignore
import { Register, Template } from 'wane'
import { CounterCmp } from './counter-cmp'

@Register(CounterCmp)
@Template(`
  <counter-cmp
    [value]="count"
    (valueChange)="onCountChange(#)"
  />
`)
export default class AppCmp {
  private count = 42

  private onCountChange (newCount: number): void {
    this.count = newCount
  }
}
