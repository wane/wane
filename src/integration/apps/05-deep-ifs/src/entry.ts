import { Template, Entry, Register } from 'wane'

export type Letters = 'a' | 'b' | 'c' | 'd' | 'e'

@Template(`
  <button (click)="changeState()">Toggle (currently {{ value }})</button>
`)
export class ToggleCmp {
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

@Entry()
@Register(CounterCmp, ToggleCmp)
@Template(`
  <div>
    <h1>Controls</h1>
    <h2>Values</h2>
    a: <counter-cmp [value]="values.a" (valueChange)="onChange('a', #)"/>
    b: <counter-cmp [value]="values.b" (valueChange)="onChange('b', #)"/>
    c: <counter-cmp [value]="values.c" (valueChange)="onChange('c', #)"/>
    d: <counter-cmp [value]="values.d" (valueChange)="onChange('d', #)"/>
    e: <counter-cmp [value]="values.e" (valueChange)="onChange('e', #)"/>
    <h2>Visibility</h2>
    a: <toggle-cmp [value]="visibility.a" (valueChange)="onToggle('a')"/>
    b: <toggle-cmp [value]="visibility.b" (valueChange)="onToggle('b')"/>
    c: <toggle-cmp [value]="visibility.c" (valueChange)="onToggle('c')"/>
    d: <toggle-cmp [value]="visibility.d" (valueChange)="onToggle('d')"/>
    e: <toggle-cmp [value]="visibility.e" (valueChange)="onToggle('e')"/>
  </div>
  
  <w:if visibility.a>
    a: {{ a }}
    <w:if visibility.b>
      b: {{ b }}
      <w:if visibility.c>
        c: {{ c }}
        <w:if visibility.d>
          d: {{ d }}
            <w:if visibility.e>
              e: {{ e }}
            </w:if>
        </w:if>
      </w:if>
    </w:if>
  </w:if>
`)
export class App {
  public values: { [key in Letters]: number } = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5,
  }

  public visibility: { [key in Letters]: boolean } = {
    a: true,
    b: true,
    c: true,
    d: true,
    e: true,
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
