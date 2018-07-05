// @ts-ignore
import { Entry, Template, Register } from 'wane'

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

@Entry()
@Register(ToggleCmp)
@Template(`
  <toggle-cmp
    [value]="bool"
    (valueChange)="onChange(#)"
  />
  
  You've chosen...
  
  <w:if isJavaScript>
    <span style="font-weight: bold">JavaScript!</span>
  </w:if>
  
  <w:if isTypeScript>
    <span style="font-style: italic">TypeScript!</span>
  </w:if>
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
