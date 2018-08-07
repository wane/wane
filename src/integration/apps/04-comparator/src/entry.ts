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

@Template(`
  <w:if isLeftGreater>left {{ isGreaterString }}</w:if>
  <w:if isRightGreater>right {{ isGreaterString }}</w:if>
  <w:if areEqual>they are equal</w:if> 
`)
export class Info {
  public isLeftGreater!: boolean
  public isRightGreater!: boolean

  private get areEqual (): boolean {
    return !this.isLeftGreater && !this.isRightGreater
  }

  private isGreaterString = `is greater`
}

@Register(Counter, Info)
@Template(`
  <span>Left number</span>
  <Counter
    [value]="left"
    (valueChange)="onLeftChange(#)"
  />
  
  <span>Right number</span>
  <Counter
    [value]="right"
    (valueChange)="onRightChange(#)"
  />
  
  <span>Info</span>
  <Info
    [isLeftGreater]="isLeftGreater"
    [isRightGreater]="isRightGreater"
  />
`)
export default class App {
  private left: number = 2
  private right: number = 1

  private onLeftChange(left: number): void {
    this.left = left
  }

  private onRightChange(right: number): void {
    this.right = right
  }

  private get isRightGreater (): boolean {
    return this.right > this.left
  }

  private get isLeftGreater (): boolean {
    return this.left > this.right
  }
}
