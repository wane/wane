export interface TraversalControl {
  end: () => void
  skipChildren: () => void
}

export class Traversal {

  public end: boolean = false
  public skipChildren: boolean = false

  public control: TraversalControl

  constructor () {
    this.control = {
      end: () => { this.end = true },
      skipChildren: () => { this.skipChildren = true },
    }
  }

  public reset () {
    this.end = false
    this.skipChildren = false
  }

}