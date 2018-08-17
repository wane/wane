// @ts-ignore
import { Register, Template, Style } from 'wane'
import Loader from './Loader'

@Register(Loader)
@Template(`
  <button [type]="type">
    <span [w:if]="!isLoading" class="content">{{ content }}</span>
    <span [w:if]="isLoading" class="loader"><Loader/></span>
  </button>
`)
@Style(`
  button {
    background-color: red;
  }
`)
export default class {

  public type: 'button' | 'submit' = 'button'

  public isLoading: boolean = false

  public content!: string

}
