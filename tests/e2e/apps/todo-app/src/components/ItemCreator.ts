// @ts-ignore
import { Template } from 'wane'

@Template(`
  <form (submit)="onSubmit(#)">
    <label>
      <span>New item</span>
      <input type="text" name="text">
    </label>
    <button type="submit">
      Add
    </button>
  </form>
`)
export default class {

  public add (newText: string) { }

  private onSubmit (event: Event): void {
    event.preventDefault()
    const $form = event.target as HTMLFormElement
    const $input = $form.elements.namedItem('text') as HTMLInputElement
    const { value } = $input
    const trimmed = value.trim()
    if (trimmed.length == 0) return
    this.add(trimmed)
    $input.value = ''
  }

}
