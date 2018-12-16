import { isEps } from './eps'
import { Lhs, Rhs } from './decorators'


export class Rule {

  constructor (public lhs: Lhs,
               public rhs: () => Rhs,
               private acceptingFunctionName: string) {
  }

  public getLhs () {
    return this.lhs
  }

  public getRhs () {
    return this.rhs
  }

  /**
   * Doesn't count eps.
   */
  public getRhsLength () {
    return this.rhs().filter(s => !isEps(s)).length
  }

  public getAcceptingFunctionName () {
    return this.acceptingFunctionName
  }

  public isEpsRule (): boolean {
    return this.rhs().length == 1 && isEps(this.rhs()[0])
  }

  public accept (...children: any[]) {
    const parent = new this.lhs()
    ;(parent as any)[this.acceptingFunctionName](...children)
    return parent
  }

  public toString () {
    return `${ this.lhs } -> ${ this.rhs().join(' ') }`
  }

}
