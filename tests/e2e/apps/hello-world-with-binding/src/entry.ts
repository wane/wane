// @ts-ignore
import { Entry, Template, Style } from 'wane'

@Entry()
@Style(`
  @import './styles/vars';
  @import '~/styles/label';

  :host {
    font-family: sans-serif;
    background-color: yellow;
  }

  p {
    color: $color;
    font-weight: bold;
  }
  
  /**
   * Very pretty label.
   */
  label {
    @include label;
  }
  
  input {
    font-size: 1.2em;
  }
`)
@Template(`
  <p>Hello, {{ name }}!</p>
  
  <label>
    <span class="test">Name</span>
    <input type="text" [value]="name" (input)="onNameChange(#)">
  </label>
`)
export class MainCmp {
  private name: string = 'World'
  private onNameChange(event: Event) {
    const target = event.target as HTMLInputElement
    this.name = target.value
  }
}
