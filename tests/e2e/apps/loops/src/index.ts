// @ts-ignore
import { Register, Template, Style } from 'wane'

interface Item {
  id: string
  item: string
}

const item = (item: string) => ({ item, id: item })

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class InsertAtStart {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [
      item('x'),
      ...this.list,
    ]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class InsertAtEnd {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [
      ...this.list,
      item('x'),
    ]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class InsertAtMiddle {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [
      ...this.list.slice(0, 1),
      item('x'),
      ...this.list.slice(1),
    ]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class RemoveAtStart {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [...this.list.slice(1)]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class RemoveAtEnd {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [...this.list.slice(0, -1)]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class RemoveAtMiddle {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [
      ...this.list.slice(0, 1),
      ...this.list.slice(2),
    ]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class InsertAtStartAndEnd {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [
      item('x'),
      ...this.list,
      item('y'),
    ]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class InsertEverywhere {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [
      item('x'),
      ...this.list.slice(0, 1),
      item('y'),
      ...this.list.slice(1),
      item('z'),
    ]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class RemoveAtStartAndEnd {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = this.list.slice(1, -1)
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class NoChange {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [...this.list]
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class ReverseOdd {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = [...this.list].reverse()
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class ReverseEven {
  private list = ['a', 'b', 'c', 'd'].map(item)

  private change () {
    this.list = [...this.list].reverse()
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class CompleteChange {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = ['x', 'y', 'z'].map(item)
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class ComplexChanges {
  private list = ['a', 'b', 'c', 'd', 'e', 'f'].map(item)

  private change () {
    this.list = ['a', 'x', 'd', 'b', 'c', 'f'].map(item)
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class FromEmpty {
  private list = [].map(item)

  private change () {
    this.list = ['a', 'b', 'c'].map(item)
  }
}

@Template(`
  <span [w:for]="item of list; key: id">{{ item.item }}</span>
  <button (click)="change()">Change</button>
`)
class ToEmpty {
  private list = ['a', 'b', 'c'].map(item)

  private change () {
    this.list = []
  }
}

@Register(
  InsertAtStart,
  InsertAtEnd,
  InsertAtMiddle,
  RemoveAtStart,
  RemoveAtEnd,
  RemoveAtMiddle,
  InsertAtStartAndEnd,
  InsertEverywhere,
  RemoveAtStartAndEnd,
  NoChange,
  ReverseOdd,
  ReverseEven,
  CompleteChange,
  ComplexChanges,
  FromEmpty,
  ToEmpty,
)
@Style(`
  :host {
    display: flex;
    flex-direction: column;
  }
`)
@Template(`
  <InsertAtStart/>
  <InsertAtEnd/>
  <InsertAtMiddle/>
  
  <RemoveAtStart/>
  <RemoveAtEnd/>
  <RemoveAtMiddle/>
  
  <InsertAtStartAndEnd/>
  <InsertEverywhere/>
  <RemoveAtStartAndEnd/>
  
  <NoChange/>
  <ReverseOdd/>
  <ReverseEven/>
  
  <CompleteChange/>
  <ComplexChanges/>
  
  <FromEmpty/>
  <ToEmpty/>
`)
export default class {
}
