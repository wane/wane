// @ts-ignore
import { component, output } from 'wane'


@component({
  template: `
    No entered data.
    <button (click)="createNew()">Add some!</button>
  `,
})
export default class EmptyState {

  @output createNew!: () => void

}
