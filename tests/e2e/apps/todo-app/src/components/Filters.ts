// @ts-ignore
import { Template, Style } from 'wane'
import { Filter } from '../types'

@Style(`
  .selected {
    font-weight: bold;
    text-decoration: underline;
  }
`)
@Template(`
  <button type="button" [className]="isSelectedAll" (click)="filterChange('all')">All</button>
  <button type="button" [className]="isSelectedComplete" (click)="filterChange('complete')">Complete</button>
  <button type="button" [className]="isSelectedIncomplete" (click)="filterChange('incomplete')">Incomplete</button>
`)
export default class {

  public filter!: Filter

  public filterChange (filter: Filter) { }

  private get isSelectedAll () {
    return this.filter == 'all' ? 'selected' : ''
  }

  private get isSelectedComplete () {
    return this.filter == 'complete' ? 'selected' : ''
  }

  private get isSelectedIncomplete () {
    return this.filter == 'incomplete' ? 'selected' : ''
  }

}
