import { Template, Entry, Register } from 'wane'

@Template(`
  <button
    type="button"
    (click)="onDecClick()"
  >
    Decrement
  </button>

  <b>{{ number }}</b>

  <button
    type="button"
    (click)="onIncClick()"
  >
    Increment
  </button>
`)
export class CounterCmp {
  public number!: number
  public numberChange(val: number) { }

  private onIncClick() {
    // console.log('on inc click', this)
    this.numberChange(this.number + 1)
  }
  private onDecClick() {
    // console.log('on dec click', this)
    this.numberChange(this.number - 1)
  }
}

@Entry()
@Register(CounterCmp)
@Template(`
  <h1>The counter</h1>

  <p>The counter currently says {{ number }}.</p>

  <div>
    <counter-cmp
      [number]="number"
      (numberChange)="onNumberChange(#)"
    />
  </div>
`)
export class AppCmp {
  private number: number = 21
  private onNumberChange(val: number) {
    // console.log('on number change, before', this)
    this.number = val
    // console.log('on number change, after', this)
  }
}
