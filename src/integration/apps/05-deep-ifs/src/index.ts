// @ts-ignore
import { Template, Register } from 'wane'

export type Letters = 'a' | 'b' | 'c'

@Template(`
  <button (click)="changeState()">Toggle (currently {{ value }})</button>
`)
export class Toggle {
  public value!: boolean

  public valueChange (newValue: boolean) {
  }

  private changeState (): void {
    this.valueChange(!this.value)
  }
}

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

@Register(Counter, Toggle)
@Template(`
  <div>
    <h1>Controls</h1>
    <h2>Values</h2>
    a: <Counter [value]="values.a" (valueChange)="onChange('a', #)"/>
    b: <Counter [value]="values.b" (valueChange)="onChange('b', #)"/>
    c: <Counter [value]="values.c" (valueChange)="onChange('c', #)"/>
    <h2>Visibility</h2>
    a: <Toggle [value]="visibility.a" (valueChange)="onToggle('a')"/>
    b: <Toggle [value]="visibility.b" (valueChange)="onToggle('b')"/>
    c: <Toggle [value]="visibility.c" (valueChange)="onToggle('c')"/>
  </div>
  
  <w:if visibility.a>
    a: {{ values.a }}
    <w:if visibility.b>
      b: {{ values.b }}
      <w:if visibility.c>
        c: {{ values.c }}
      </w:if>
    </w:if>
  </w:if>
`)
export default class App {
  public values: { [key in Letters]: number } = {
    a: 1,
    b: 2,
    c: 3,
  }

  public visibility: { [key in Letters]: boolean } = {
    a: true,
    b: true,
    c: true,
  }

  private onToggle (name: Letters): void {
    const newValue = !this.visibility[name]
    this.visibility = {
      ...this.visibility,
      [name]: newValue,
    }
  }

  private onChange (name: Letters, newValue: number): void {
    this.values = {
      ...this.values,
      [name]: newValue,
    }
  }
}
