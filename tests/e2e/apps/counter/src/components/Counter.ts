// @ts-ignore
import { Template, Style } from 'wane'

@Style(`
  @import '~/styles/global';
  
  :host {
    @include horizontal;
    align-items: center;
  }

  button {
    background-color: $blue;
    color: white;
    border: none;
    padding: 1em;
    font-size: inherit;
  }
  
  div {
    @include circle(2em);
    @include center;
    font-size: 1.5em;
    background: $aqua;
    border: 3px solid white;
    padding: 1em;
  }
  
  span {
    display: block;
  }
`)
@Template(`
  <button (click)="dec()">
    Decrement
  </button>
  
  <div>
    <span>{{ value }}</span>
  </div>
  
  <button (click)="inc()">
    Increment
  </button>
`)
export default class {

  public value!: number

  public valueChange (value: number): void {
  }

  private inc () {
    this.valueChange(this.value + 1)
  }

  private dec () {
    this.valueChange(this.value - 1)
  }

}
