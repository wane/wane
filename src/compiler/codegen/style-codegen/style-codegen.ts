export class StyleCodegen {

  private style: string = ''

  public addStyle(css: string) {
    this.style += this.style == '' ? css : `\n${css}`
  }

  public getStyle(): string {
    return this.style
  }

}
