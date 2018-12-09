import { Token, WithData } from '../../libs/lexer'

export class BindingToken extends Token {
  public kind: string = '?BindingToken?'

  public toString () {
    return this.kind
  }

  public print (level: number = 0) {
    const whitespaceCount = level * 2
    const whitespace = ''.padStart(whitespaceCount)
    return `${ whitespace }${ this }`
  }
}

export class OpenParenToken extends BindingToken {
  public kind = `OpenParenToken`
}

export class CloseParenToken extends BindingToken {
  public kind = `CloseParenToken`
}

export class OpenSquareBracketToken extends BindingToken {
  public kind = `OpenSquareBracketToken`
}

export class CloseSquareBracketToken extends BindingToken {
  public kind = `CloseSquareBracketToken`
}

export class DotToken extends BindingToken {
  public kind = `DotToken`
}

export class CommaToken extends BindingToken {
  public kind = `CommaToken`
}

export class PipeToken extends BindingToken {
  public kind = `PipeToken`
}

export abstract class LiteralToken extends WithData(BindingToken) {
  public constructor (data?: string) {
    super()
    if (data != null) this.data = data
  }
}

export class StringLiteralToken extends LiteralToken {
  public kind = 'StringLiteralToken'

  public toString () {
    return `${ this.kind }<${ this.getData() }>`
  }
}

export class NumberLiteralToken extends LiteralToken {
  public kind = 'NumberLiteralToken'

  private radix: 10 | 2 | 8 | 16 = 10

  public declareRadix (radix: 10 | 2 | 8 | 16) {
    this.radix = radix
  }

  public getRadix () {
    return this.radix
  }

  public toString () {
    return `${ this.kind }<${ this.getData() }>`
  }
}

// TODO: These are treated as identifiers for now.
//
// export class BooleanLiteralToken extends WithData(BindingToken) {
// }
//
// export class UndefinedLiteralToken extends BindingToken {
// }
//
// export class NullLiteralToken extends BindingToken {
// }
//
// export class NanLiteralToken extends BindingToken {
// }
//
// export class InfinityLiteralToken extends BindingToken {
// }

export class IdentifierToken extends WithData(BindingToken) {
  public kind = 'IdentifierToken'

  public constructor (data?: string) {
    super()
    if (data != null) this.data = data
  }

  public toString () {
    return `${ this.kind }<${ this.getData() }>`
  }
}

export class PlaceholderArgumentToken extends BindingToken {
  public kind = `PlaceholderArgumentToken`
}
