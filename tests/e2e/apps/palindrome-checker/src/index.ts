// @ts-ignore
import { Template } from 'wane'

@Template(`
  <input
    type="text"
    [value]="value"
    (input)="setValue(#)"
  >
  
  <w:if isPalindrome>
    Yup, it's a <b>palindrome</b>!  
  </w:if>
  
  <w:if !isPalindrome>
    Nah, this is <strong>not</strong> a palindrome.  
  </w:if>
`)
export default class App {

  private value: string = ''

  private setValue (val: Event): void {
    const target = val.target as HTMLInputElement
    this.value = target.value
  }

  private get isPalindrome (): boolean {
    const reverse = this.value.split('').reverse().join('')
    return this.value == reverse
  }

}
