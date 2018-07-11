// @ts-ignore
import { Template, Entry, Style } from 'wane'
import { getAnswer } from './mock-api'

@Entry()
@Style(`
  .loading {
    opacity: .6;
    font-style: italic;
  }
`)
@Template(`
  <form (submit)="onSubmit(#)">
    <label>
      <span>Question</span>{{' '}}
      <input type="text" name="question">
    </label>
  </form>
  
  <w:if isAnswerVisible>
    <w:if isLoading>
      <div className="loading">Loading...</div>
    </w:if>
    <w:if !isLoading>
      <output>{{ answer }}</output>
    </w:if>  
  </w:if>
`)
export class App {

  private answer: string | undefined
  private isLoading: boolean = false
  private isAnswerVisible: boolean = false

  private onSubmit (event: Event): void {
    this.isAnswerVisible = true
    event.preventDefault()
    const formEl = event.target as HTMLFormElement
    const questionEl = formEl.elements.namedItem('question') as HTMLInputElement
    this.isLoading = true
    getAnswer(questionEl.value).then(answer => {
      this.answer = answer
      questionEl.value = ''
      this.isLoading = false
    })
  }

}
