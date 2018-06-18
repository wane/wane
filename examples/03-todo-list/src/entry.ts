import { Entry, Template, Register, HostAttribute } from 'wane'

const enum Filter {
  All,
  Done,
  NotDone,
}

interface Item {
  id: number,
  text: string
  isDone: boolean
}

@Template(`
  <label>
    <input type="checkbox" [checked]="isDone" (change)="toggle()">
    <span>{{ text }}</span>
  </label>
`)
export class ListItemCmp {
  public text: string
  public isDone: boolean
  public toggle() {}
}

@Register(ListItemCmp)
@Template(`
  <W@if isEmpty>
    <p>The list is empty!</p>
  </W@if>

  <W@if !isEmpty>
    <h2>TODO list</h2>
    <button (click)="reset()">Reset</button>
    <div>
      <W@for item of items>
        <list-item-cmp
          [text]="item.text"
          [isDone]="item.isDone"
          (toggle)="onToggle(item.id)"
        />
      </W@for>
    </div>
  </W@if>
`)
export class ListCmp {
  public items!: Item[]
  public toggle(id: number) { }
  public reset() { }
  private get isEmpty() {
    return this.items.length == 0
  }
  private onToggle(id: number): void {
    this.toggle(id)
  }
}

@Template(`
  <form (submit)="onSubmit(#)">
    <input
      type="text"
      name="new-item"
      [value]="currentlyTypedString"
      (input)="onCurrentlyTypedStringChange(#)"
    >
    <button type="submit">
      Add
    </button>
  </form>
`)
export class CreatorCmp {
  public create(text: string) { }
  private currentlyTypedString: string = ''
  private onCurrentlyTypedStringChange(event: Event): void {
    const { value } = event.target as HTMLInputElement
    this.currentlyTypedString = value
  }
  private onSubmit(event: Event) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const { value } = form.elements['new-item'] as HTMLInputElement
    this.currentlyTypedString = ''
    this.create(value)
  }
}

@Template(`
  <!--<W@for filter of filters>
    <button
      type="button"
      [attr.aria-checked]="filter.isCurrent"
      [tabIndex]="filter.tabIndex"
    >
      {{ filter.text }}
    </button>
  </W@for>-->
  <W@for filter of filters>
    <button
      type="button"
      [style]="filter.style"
      (click)="filterChange(filter.value)"
    >
      {{ filter.text }}
    </button>
  </W@for>
`)
export class FiltersCmp {
  @HostAttribute(`role`) private role = `radio-group`
  @HostAttribute(`aria-label`) private ariaLabel = `Filters`

  public filter!: Filter
  public filterChange (filter: Filter) {}

  private filterDefinitions = [
    { value: Filter.All, text: `Show all` },
    { value: Filter.Done, text: `Show complete` },
    { value: Filter.NotDone, text: `Show incomplete` },
  ]

  private get filters() {
    return this.filterDefinitions.map(def => ({
      ...def,
      isCurrent: this.isCurrent(def.value),
      tabIndex: this.getTabIndexFor(def.value),
      style: this.isCurrent(def.value) ? `font-weight: bold` : null
    }))
  }

  private isCurrent(filter: Filter): boolean {
    return this.filter == filter
  }

  private getTabIndexFor(filter: Filter): string {
    if (this.isCurrent(filter)) {
      return `-1`
    } else {
      return `0`
    }
  }
}

@Entry()
@Register(ListCmp, CreatorCmp, FiltersCmp)
@Template(`
  <header>
    <h1>A {{ appName }} made by {{ authorName }}.</h1>
  </header>
  <main>
    <list-cmp
      [items]="filteredItems"
      (toggle)="toggleItem(#)"
      (reset)="reset()"
    />
    <creator-cmp
      (create)="addNew(#)"
    />
    <filters-cmp
      [filter]="currentFilter"
      (filterChange)="onCurrentFilterChange(#)"
    />
    <pre>{{ json }}</pre>
  </main>
`)
export class TodoCmp {
  private appName = `TODO list`
  private authorName = `me`
  private lastId = -1
  private items: Item[] = [
    { id: 100, isDone: false, text: `foo` },
    { id: 200, isDone: false, text: `bar` },
    { id: 300, isDone: true, text: `baz` },
    { id: 400, isDone: true, text: `qux` },
  ]
  private get filteredItems(): Item[] {
    switch (this.currentFilter) {
      case Filter.All: return [...this.items]
      case Filter.Done: return this.items.filter(item => item.isDone)
      case Filter.NotDone: return this.items.filter(item => !item.isDone)
    }
  }
  private toggleItem(id: Item['id']): void {
    console.log(`Toggling item with id ${id}...`)
    const index = this.items.findIndex(item => item.id == id)
    if (index == -1) return
    this.items = [
      ...this.items.slice(0, index),
      {
        ...this.items[index],
        isDone: !this.items[index].isDone,
      },
      ...this.items.slice(index + 1),
    ]
  }
  private addNew(text: string): void {
    const id = ++this.lastId
    this.items = [
      ...this.items,
      { id, isDone: false, text },
    ]
  }
  private reset(): void {
    this.items = []
  }
  private currentFilter: Filter = Filter.All
  private onCurrentFilterChange(newFilter: Filter): void {
    this.currentFilter = newFilter
  }
  private get json() {
    return JSON.stringify(this.items, null, 2)
  }
}
