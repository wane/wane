import { Entry, Template, Register } from 'wane'

@Template(`
  <button (click)="dec()">Decrement</button>
  <span>{{ value }}</span>
  <button (click)="inc()">Increment</button>
`)
export class CounterCmp {
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

@Template(`
  <w:if isLeftGreater>left is greater</w:if>
  <w:if isRightGreater>right is greater</w:if>
  <w:if areEqual>they are equal</w:if> 
`)
export class InfoCmp {
  public isLeftGreater!: boolean
  public isRightGreater!: boolean

  private get areEqual (): boolean {
    return !this.isLeftGreater && !this.isRightGreater
  }
}

@Entry()
@Register(CounterCmp, InfoCmp)
@Template(`
  <span>Left number</span>
  <counter-cmp
    [value]="left"
    (valueChange)="onLeftChange(#)"
  />
  
  <span>Right number</span>
  <counter-cmp
    [value]="right"
    (valueChange)="onRightChange(#)"
  />
  
  <span>Info</span>
  <info-cmp
    [isLeftGreater]="isLeftGreater"
    [isRightGreater]="isRightGreater"
  />
`)
export class App {
  private left: number = 2
  private right: number = 1

  private onLeftChange(left: number): void {
    this.left = left
  }

  private onRightChange(right: number): void {
    this.right = right
  }

  private isRightGreater (): boolean {
    return this.right > this.left
  }

  private isLeftGreater (): boolean {
    return this.left > this.right
  }
}
