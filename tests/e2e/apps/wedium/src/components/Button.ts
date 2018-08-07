// @ts-ignore
import { Template, Style } from 'wane'

@Style(`
  button {
    background-color: red;
  }
`)
@Template(`
  <button [type]="type">
    <span class="content">{{ content }}</span>
    <span class="loader">
      
    </span>
  </button>
`)
export default class Button {

  public type: 'button' | 'submit' = 'button'

  public content!: string

}
