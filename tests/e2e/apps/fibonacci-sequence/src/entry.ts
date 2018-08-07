// @ts-ignore
import { Register, Template } from 'wane'

function* fibonacci (n: number) {
  let current = 1
  let next = 2

  while (n-- > 0) {
    yield current;
    [current, next] = [next, current + next]
  }
}

@Template(`
  <w:for number of numbers>
    {{ number }}{{' '}}
  </w:for>
`)
export class SequenceCmp {
  public numbers!: number[]
}

@Register(SequenceCmp)
@Template(`
  <form (submit)="onFormSubmit(#)">
    <label>
      <span>Number of elements</span>
      <input
        type="number"
        name="numberOfElements"
        [value]="numberOfElements"
      >
    </label>
    <button type="submit">Update</button>
  </form>
  
  <hr>
  
  <h1>First {{ numberOfElements }} Fibonacci numbers</h1>
  <sequence-cmp [numbers]="fibonacciSequence"/>
`)
export default class App {

  private numberOfElements: number = 5

  private fibonacciSequence: number[]

  constructor () {
    this.fibonacciSequence = [...fibonacci(this.numberOfElements)]
  }

  private onFormSubmit (event: Event): void {
    event.preventDefault()
    const formEl = event.target as HTMLFormElement
    const inputEl = formEl.elements.namedItem('numberOfElements') as HTMLInputElement
    const value = Number.parseInt(inputEl.value)

    this.numberOfElements = value
    this.fibonacciSequence = [...fibonacci(this.numberOfElements)]
  }

}
