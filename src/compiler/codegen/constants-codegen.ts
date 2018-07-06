interface Constant {
  name: string
  value: string
}

export class ConstantsCodegen {

  private constants: Constant[] = []

  public addConstant (name: string, value: string): void {
    const constantWithSameName = this.constants.find(({name: existingName}) => {
      return existingName == name
    })
    if (constantWithSameName != null) {
      return
    }
    this.constants.push({name, value})
  }

  public hasConstants (): boolean {
    return this.constants.length > 0
  }

  public toString (): string {
    return this.constants
        .map(({name, value}) => `export const ${name} = ${value}`)
        .join('\n')
      + '\n'
  }

}
