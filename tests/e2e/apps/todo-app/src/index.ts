// @ts-ignore
import * as W from 'wane'
import List from './components/List'
import { Filter, TodoItem } from './types'
import Filters from './components/Filters'

let counter: number = 0

@W.Register(List, Filters)
@W.Template(`
  <List
    [items]="visibleItems"
    [totalItemsCount]="items.length"
    (add)="addItem(#)"
    (toggle)="toggle(#)"
  />
  <Filters
    [filter]="selectedFilter"
    (filterChange)="changeFilter(#)"
  />
`)
export default class Entry {

  private items: TodoItem[] = []
  private selectedFilter: Filter = 'all'
  private editItemId: number | null = null

  private get isEmpty (): boolean {
    return this.items.length == 0
  }

  private get visibleItems (): TodoItem[] {
    switch (this.selectedFilter) {
      case 'all':
        return this.items
      case 'complete':
        return this.items.filter(item => item.isCompleted)
      case 'incomplete':
        return this.items.filter(item => !item.isCompleted)
    }
  }

  private addItem (itemText: string): void {
    const trimmed = itemText.trim()
    if (trimmed.length == 0) return
    const newItem = {
      id: counter++,
      text: trimmed,
      isCompleted: false,
    }
    this.items = [...this.items, newItem]
  }

  private toggle (itemId: number): void {
    const index = this.items.findIndex(({ id }) => id == itemId)
    if (index == -1) {
      throw new Error(`Item with ID ${itemId} not found.`)
    }
    const oldItem = this.items[index]
    const newItem: TodoItem = { ...oldItem, isCompleted: !oldItem.isCompleted }
    const before = this.items.slice(0, index)
    const after = this.items.slice(index + 1)
    this.items = [...before, newItem, ...after]
  }

  private changeFilter (filter: Filter) {
    this.selectedFilter = filter
  }

}
