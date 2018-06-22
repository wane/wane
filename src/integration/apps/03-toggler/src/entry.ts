// @ts-ignore
import { Entry, Template, Register } from 'wane'

@Template(`a
  <button (click)="changeState()">Toggle (currently {{ value }})</button>b
`)
export class ToggleCmp {
  public value!: boolean

  public valueChange (newValue: boolean) {
  }

  private changeState (): void {
    this.valueChange(!this.value)
  }
}

@Entry()
@Register(ToggleCmp)
@Template(`c
  <toggle-cmp
    [value]="bool"
    (valueChange)="onChange(#)"
  />
  
  You've chosen...
  
  <w:if isJavaScript>q
    <span style="font-weight: bold">JavaScript!</span>Q
  </w:if>d
  
  <w:if isTypeScript>w
    <span style="font-style: italic">TypeScript!</span>W
  </w:if>e
`)
export class App {
  private bool: boolean = false

  private onChange (newBool: boolean): void {
    this.bool = newBool
  }

  private get isJavaScript (): boolean {
    return this.bool
  }

  private get isTypeScript (): boolean {
    return !this.bool
  }
}
