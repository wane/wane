import {
  Lexer,
  State,
  Unicode,
  is,
  isAlphanumericAsciiCharacter,
  isAsciiDigit,
  isAsciiHexDigit,
  isAsciiLetter,
  isEof,
  isNonZeroAsciiDigit,
  isSpaceCharacter,
  range,
} from '../../../libs/lexer'
import {
  BindingToken,
  CloseSquareBracketToken,
  CloseParenToken,
  DotToken,
  IdentifierToken,
  NumberLiteralToken,
  OpenParenToken,
  OpenSquareBracketToken,
  PipeToken,
  StringLiteralToken, PlaceholderArgumentToken, CommaToken,
} from './binding-tokens'


export class WaneTemplateBindingLexer extends Lexer<BindingToken> {

  private betweenExpressionTokensState: State = () => {
    const c = this.consume()
    switch (true) {
      case isEof(c):
        if (this.getTokenOrUndefined() != null) this.emit()
        break
      case isSpaceCharacter(c):
        // Ignore
        break
      case is(Unicode.LeftParenthesis)(c):
        this.create(new OpenParenToken()).emit()
        break
      case is(Unicode.RightParenthesis)(c):
        this.create(new CloseParenToken()).emit()
        break
      case is(Unicode.LeftSquareBracket)(c):
        this.create(new OpenSquareBracketToken()).emit()
        break
      case is(Unicode.RightSquareBracket)(c):
        this.create(new CloseSquareBracketToken()).emit()
        break
      case is(Unicode.FullStop)(c):
        this.switchTo(this.fullStopState)
        break
      case is(Unicode.VerticalLine)(c):
        this.create(new PipeToken()).emit()
        break
      case is(Unicode.PlusSign)(c):
      case is(Unicode.HyphenMinus)(c):
        this.create(new NumberLiteralToken().appendData(c as string))
        this.switchTo(this.signedNumberLiteralState)
        break
      case is(Unicode.Apostrophe)(c):
        this.create(new StringLiteralToken())
        this.switchTo(this.stringLiteralState)
        break
      case is(Unicode.NumberSign)(c):
        this.create(new PlaceholderArgumentToken()).emit()
        break
      case is(Unicode.Comma)(c):
        this.create(new CommaToken()).emit()
        break
      case is(Unicode.DigitZero)(c):
        this.create(new NumberLiteralToken())
        this.reconsumeIn(this.leadingZeroNumberLiteralState)
        break
      case isAsciiDigit(c):
        this.create(new NumberLiteralToken())
        this.reconsumeIn(this.numberLiteralBeforeDecimalDotState)
        break
      case isAsciiLetter(c):
        this.create(new IdentifierToken())
        this.reconsumeIn(this.identifierState)
    }
  }

  private fullStopState: State = () => {
    const c = this.consume()
    switch (true) {
      case isAsciiDigit(c):
        this.create(new NumberLiteralToken().appendData(Unicode.FullStop), 1)
        this.reconsumeIn(this.numberLiteralAfterDecimalDotState)
        break
      default:
        this.create(new DotToken(), 1).emit(1)
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private identifierState: State = () => {
    const c = this.consume()
    switch (true) {
      case isAlphanumericAsciiCharacter(c):
        this.getToken(IdentifierToken).appendData(c as string)
        break
      default:
        this.emit(1)
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private stringLiteralState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.Apostrophe)(c):
        this.emit()
        this.switchTo(this.betweenExpressionTokensState)
        break
      case is(Unicode.ReverseSolidus)(c):
        this.switchTo(this.stringLiteralEscapeCharacterState)
        break
      case isEof(c):
        this.parseError()
        this.emit()
        this.reconsumeIn(this.betweenExpressionTokensState)
        break
      default:
        this.getToken(StringLiteralToken).appendData(c as string)
    }
  }

  private stringLiteralEscapeCharacterState: State = () => {
    const c = this.consume()
    switch (true) {
      case isEof(c):
        this.parseError()
        this.emit()
        this.reconsumeIn(this.betweenExpressionTokensState)
        break
      default:
        this.getToken(StringLiteralToken).appendData(c as string)
        this.switchTo(this.stringLiteralState)
    }
  }

  // region Number states

  private numberLiteralBeforeDecimalDotState: State = () => {
    const c = this.consume()
    switch (true) {
      case isAsciiDigit(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      case is(Unicode.LatinCapitalLetterE)(c):
      case is(Unicode.LatinSmallLetterE)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        this.switchTo(this.numberLiteralScientificNotationState)
        break
      case is(Unicode.FullStop)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        this.switchTo(this.numberLiteralAfterDecimalDotState)
        break
      default:
        this.emit(1)
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private numberLiteralAfterDecimalDotState: State = () => {
    const c = this.consume()
    switch (true) {
      case isAsciiDigit(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      case is(Unicode.LatinCapitalLetterE)(c):
      case is(Unicode.LatinSmallLetterE)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        this.switchTo(this.numberLiteralScientificNotationState)
        break
      default:
        this.emit(1)
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private leadingZeroNumberLiteralState: State = () => {
    const c = this.consume()
    switch (true) {
      case c == 'b':
        this.getToken(NumberLiteralToken).appendData(c as string).declareRadix(2)
        this.switchTo(this.binaryNumberState)
        break
      case c == 'o':
        this.getToken(NumberLiteralToken).appendData(c as string).declareRadix(8)
        this.switchTo(this.octalNumberState)
        break
      case c == 'x':
        this.getToken(NumberLiteralToken).appendData(c as string).declareRadix(16)
        this.switchTo(this.hexadecimalNumberState)
        break
      case is(Unicode.FullStop)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        this.switchTo(this.numberLiteralBeforeDecimalDotState)
        break
      case is(Unicode.DigitZero)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      case range(Unicode.DigitOne, Unicode.DigitSeven)(c):
        this.getToken(NumberLiteralToken).appendData(c as string).declareRadix(8)
        this.switchTo(this.numberLiteralBeforeDecimalDotState)
        break
      default:
        this.emit(1)
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private signedNumberLiteralState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.DigitZero)(c):
        break
      case isNonZeroAsciiDigit(c):
        this.reconsumeIn(this.numberLiteralBeforeDecimalDotState)
        break
      case is(Unicode.FullStop)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        this.switchTo(this.numberLiteralAfterDecimalDotState)
        break
      default:
        this.parseError()
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private numberLiteralScientificNotationState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.PlusSign)(c):
      case is(Unicode.HyphenMinus)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        this.switchTo(this.numberLiteralScientificNotationSignState)
        break
      case isAsciiDigit(c):
        this.reconsumeIn(this.numberLiteralAfterDecimalDotState)
        break
      default:
        this.parseError()
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private numberLiteralScientificNotationSignState: State = () => {
    const c = this.consume()
    switch (true) {
      case isAsciiDigit(c):
        this.reconsumeIn(this.numberLiteralAfterDecimalDotState)
        break
      default:
        this.parseError()
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private binaryNumberState: State = () => {
    const c = this.consume()
    switch (true) {
      case range(Unicode.DigitZero, Unicode.DigitOne)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      case isAlphanumericAsciiCharacter(c):
        this.parseError()
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      default:
        this.emit(1)
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private octalNumberState: State = () => {
    const c = this.consume()
    switch (true) {
      case range(Unicode.DigitZero, Unicode.DigitSeven)(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      case isAlphanumericAsciiCharacter(c):
        this.parseError()
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      default:
        this.emit(1)
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  private hexadecimalNumberState: State = () => {
    const c = this.consume()
    switch (true) {
      case isAsciiHexDigit(c):
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      case isAlphanumericAsciiCharacter(c):
        this.parseError()
        this.getToken(NumberLiteralToken).appendData(c as string)
        break
      default:
        this.emit(1)
        this.reconsumeIn(this.betweenExpressionTokensState)
    }
  }

  // endregion Number states

  protected startState: State = this.betweenExpressionTokensState

  // region Helpers

  // endregion Helpers

}
