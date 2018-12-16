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

  public peek<V extends T = T> (): V {
    if (this.isEmpty()) throw new Error(`Cannot peek into empty stack.`)
    return this.peekUnsafe() as V
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

  public reset () {
    this.data = []
  }

  public toArray () {
    return this.data
  }

}

export class Queue<T> {

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
    return this.data[0]
  }

  public peek<V extends T = T> (): V {
    if (this.isEmpty()) throw new Error(`Cannot peek into empty queue.`)
    return this.peekUnsafe() as V
  }

  public popUnsafe (): T | undefined {
    return this.data.shift()
  }

  public pop (): T {
    if (this.isEmpty()) throw new Error(`Cannot pop an empty queue.`)
    return this.popUnsafe()!
  }

  public reset () {
    this.data = []
  }

  public toArray () {
    return this.data
  }

}
