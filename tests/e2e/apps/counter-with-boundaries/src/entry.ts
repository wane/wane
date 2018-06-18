import { Entry, Template, Register } from 'wane'

@Template(`
  <button (click)="dec10()" [disabled]="isDec10Disabled">
    -10
  </button>
  
  <button (click)="dec()" [disabled]="isDecDisabled">
    -1
  </button>
  
  <button (click)="inc()" [disabled]="isIncDisabled">
    +1
  </button>
  
  <button (click)="inc10()" [disabled]="isInc10Disabled">
    +10  
  </button>
  
  <span>{{ value }}</span>
`)
export class CounterCmp {

  public max: number = 50
  public min: number = 0

  public value!: number
  public valueChange(value: number) {}

  private valueChangeBy(delta: number) {
    this.valueChange(this.value + delta)
  }

  private canAdd(delta: number): boolean {
    const futureValue = this.value + delta
    return this.min <= futureValue && futureValue <= this.max;
  }

  private get isIncDisabled(): boolean {
    return !this.canAdd(1)
  }
  private inc() {
    this.valueChangeBy(1)
  }

  private get isDecDisabled(): boolean {
    return !this.canAdd(-1)
  }
  private dec() {
    this.valueChangeBy(-1)
  }

  private get isInc10Disabled(): boolean {
    return !this.canAdd(10)
  }
  private inc10() {
    this.valueChangeBy(10)
  }

  private get isDec10Disabled(): boolean {
    return !this.canAdd(-10)
  }
  private dec10() {
    this.valueChangeBy(-10)
  }

}

@Entry()
@Register(CounterCmp)
@Template(`
  <counter-cmp
    [value]="value"
    (valueChange)="onValueChange(#)"
  />
`)
export class AppCmp {

  private value = 25
  private onValueChange(value: number): void {
    this.value = value
  }

}
