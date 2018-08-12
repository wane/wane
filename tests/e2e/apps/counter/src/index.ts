// @ts-ignore
import { Register, Template, Style } from 'wane'
import Counter from './components/Counter'

@Register(Counter)
@Template(`
  <Counter
    [value]="count"
    (valueChange)="onCountChange(#)"
  />
`)
@Style(`
  @import '~/styles/global';
  
  :host {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100vh;
    box-shadow: 0 0 0 5px $red inset;
    @include center;
  }
  
  Counter {
    background-color: $yellow;
    padding: 3rem;
  }
`)
export default class {

  private count = 42

  private onCountChange (newCount: number): void {
    this.count = newCount
  }

}
