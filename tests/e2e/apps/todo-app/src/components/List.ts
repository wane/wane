// @ts-ignore
import { Template, Register } from 'wane'
import Item from './Item'
import ItemCreator from './ItemCreator'
import { TodoItem } from '../types'

@Register(Item, ItemCreator)
@Template(`
  <p [w:if]="isEmpty" className="empty">
    The list is empty.
  </p>

  <ol [w:if]="!isEmpty">
    <w:if !isItemsEmpty>
      <li [w:for]="item of items; key: id">
        <Item
          [item]="item"
          (toggle)="toggle(item.id)"
        />
      </li>    
    </w:if>
    
    <p [w:if]="isItemsEmpty" className="empty">
      No items to show for this filter.<br>
      There are {{ totalItemsCount }} items in total.     
    </p>
  </ol>

  <ItemCreator (add)="onAdd(#)"/>
`)
export default class List {

  public items!: TodoItem[]
  public totalItemsCount!: number

  public add (text: string) {}
  public toggle (id: number) {}

  private get isEmpty () {
    return this.totalItemsCount == 0
  }

  private get isItemsEmpty () {
    return this.items.length == 0
  }

  private onAdd (text: string) {
    this.add(text)
  }

}
