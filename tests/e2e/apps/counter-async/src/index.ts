// @ts-ignore
import * as w from 'wane'

@w.Template(`
  <p>The following button +1s once every 500ms.</p>
  <span>{{ value }}</span>
  <button (click)="change(10)">+10</button>
  <button (click)="change(-10)">-10</button>
  <button (click)="asyncChange(100)">+100 after one second</button>
`)
class Counter {
  public value: number = 42

  public valueChange (value: number) {
  }

  constructor () {
    setInterval(() => {
      this.change(1)
    }, 500)
  }

  private change (delta: number): void {
    this.value += delta
  }

  private asyncChange (delta: number): void {
    setTimeout(() => this.change(delta), 1000)
  }
}

@w.Register(Counter)
@w.Template(`
  <Counter/>
`)
export default class {
}
