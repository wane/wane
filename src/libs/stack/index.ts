export class Stack<T> {

  private data: Array<T> = []

  public get size () {
    return this.data.length
  }

  public isEmpty () {
    return this.size == 0
  }

  public isNotEmpty () {
    return !this.isEmpty()
  }

  public push (t: T) {
    this.data.push(t)
  }

  public peekUnsafe (): T | undefined {
    return this.data[this.data.length - 1]
  }

  public peek (): T {
    if (this.isEmpty()) throw new Error(`Cannot peek into empty stack.`)
    return this.peekUnsafe()!
  }

  public pop (): T
  public pop (count: number): Array<T>
  public pop (count?: any) {
    if (count === undefined) {
      return this.data.pop()
    } else {
      return this.data.splice(-count, count)
    }
  }

  public toArray () {
    return this.data
  }

}
