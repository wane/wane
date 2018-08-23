// @ts-ignore
import { Register, Template } from 'wane'
import Item from './Item'
import ItemCreator from './ItemCreator'
import { TodoItem } from '../types'

@Register(Item, ItemCreator)
@Template(`
  <p [w:if]="isEmpty" className="empty">
    The list is empty.
  </p>

  <w:if !isEmpty>
    <w:if !isItemsEmpty>
      <ol>
        <li [w:for]="item of items; key: id">
          <Item
            [item]="item"
            (toggle)="toggle(item.id)"
            (edit)="edit(#)"
          />
        </li>
      </ol>    
    </w:if>
    
    <p [w:if]="isItemsEmpty" className="empty">
      No items to show for this filter.<br>
      There are {{ totalItemsCount }} items in total.     
    </p>
  </w:if>

  <ItemCreator (add)="add(#)"/>
`)
export default class List {

  public items!: TodoItem[]
  public totalItemsCount!: number

  public add (text: string) {}

  public toggle (id: number) {}

  public edit (data: {id: number, text: string}) {}

  private get isEmpty () {
    return this.totalItemsCount == 0
  }

  private get isItemsEmpty () {
    return this.items.length == 0
  }

}
