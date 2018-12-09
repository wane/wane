import { Lexer, State } from '../../libs/lexer'
import { is, isAsciiDigit, isAsciiLetter, isEof, isSpaceCharacter, or } from '../../libs/lexer/helpers'
import { Unicode } from '../../libs/lexer/unicode'
import {
  CharacterToken,
  CommentToken,
  EndTagToken,
  InterpolationToken,
  MarkupToken,
  NonPlainAttribute,
  PlainAttribute,
  StartTagToken,
  TagToken,
} from './markup-tokens'

const isTagNameCharacter = or(isAsciiLetter, isAsciiDigit, is(Unicode.HyphenMinus), is(Unicode.LowLine))
const isAttributeNameCharacter = isTagNameCharacter
const isAttributeValueCharacter = isTagNameCharacter

export class WaneTemplateMarkupLexer extends Lexer<MarkupToken> {

  /**
   * Based on § 8.2.4.1.
   * The FSM collects regular "data" characters between tags and interpolation tags.
   */
  private dataState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.LessThanSign)(c):
        this.switchTo(this.tagOpenState)
        break
      case is(Unicode.LeftCurlyBracket)(c):
        this.switchTo(this.dataLeftCurlyBraceState)
        break
      case isEof(c):
        this.emitEof()
        break
      default:
        this.emitChar(c as string)
    }
  }

  /**
   * Based on § 8.2.4.6.
   * After just seeing "<", this could either turn out to be:
   *  - an opening (or self-losing) tag if we see a letter,
   *  - the closing tag if we see "/"
   *  - a start of "markup declaration open state", of which we only implement the comment <!-- for Wane.
   */
  private tagOpenState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.Solidus)(c):
        this.switchTo(this.endTagOpenState)
        break
      case is(Unicode.ExclamationMark)(c):
        this.switchTo(this.markupDeclarationOpenState)
        break
      case isAsciiLetter(c):
        this.create(new StartTagToken(), '<'.length)
        this.reconsumeIn(this.tagNameState)
        break
      case is(Unicode.QuestionMark)(c):
        this.parseError()
        this.create(new CommentToken().declareBogus(), '<'.length)
        this.reconsumeIn(this.bogusCommentState)
        break
      default:
        this.parseError()
        this.emitChar(Unicode.LessThanSign)
        this.reconsumeIn(this.dataState)
    }
  }

  /**
   * Based on § 8.2.4.7.
   *
   * We get here only from the Tag open state, so at this point we have "</" recognized.
   * TODO We should accept broader range than ASCII here, since Wane components can be valid JavaScript names as well.
   */
  private endTagOpenState: State = () => {
    const c = this.consume()
    switch (true) {
      case isAsciiLetter(c):
        this.create(new EndTagToken(), '</'.length)
        this.reconsumeIn(this.tagNameState)
        break
      case is(Unicode.GreaterThanSign)(c):
        this.parseError()
        this.switchTo(this.dataState)
        break
      case isEof(c):
        this.parseError()
        this.emitChar(Unicode.LessThanSign, 2)
        this.emitChar(Unicode.Solidus, 1)
        this.emitEof()
        break
      default:
        this.parseError()
        this.create(new CommentToken().declareBogus(), '</'.length)
        this.reconsumeIn(this.bogusCommentState)
    }
  }

  /**
   * Based on § 8.2.4.8.
   *
   * Note that in this state we consume the name for both starting and ending tags.
   *
   * The main difference here is that we do not lower-case the ASCII letters.
   */
  private tagNameState: State = () => {
    const c = this.consume()
    switch (true) {
      case isSpaceCharacter(c):
        this.switchTo(this.beforeAttributeNameState)
        break
      case is(Unicode.Solidus)(c):
        this.switchTo(this.selfClosingStartTagState)
        break
      case is(Unicode.GreaterThanSign)(c):
        this.emit()
        this.switchTo(this.dataState)
        break
      case isEof(c):
        this.parseError()
        this.emitEof()
        break
      default:
        this.getToken(TagToken).appendToTagName(c as string)
    }
  }

  /**
   * Based on § 8.2.4.32.
   *
   * The addition here is that we also care for [ and ( in order to tokenize
   * expression attributes and invocation attributes. What the spec calls "attribute" we call
   * "plain attribute" to differentiate between them more explicitly.
   */
  private beforeAttributeNameState: State = () => {
    const c = this.consume()
    switch (true) {
      case isSpaceCharacter(c):
        // Ignore the character.
        break
      case is(Unicode.Solidus)(c):
      case is(Unicode.GreaterThanSign)(c):
      case isEof(c):
        this.reconsumeIn(this.afterPlainAttributeNameState)
        break
      case is(Unicode.EqualsSign)(c):
        this.parseError()
        this.getToken(TagToken).startNewPlainAttribute().appendToName(c as string)
        this.switchTo(this.plainAttributeNameState)
        break
      case is(Unicode.LeftSquareBracket)(c):
        this.getToken(TagToken).startNewExpressionAttribute()
        this.switchTo(this.expressionOrInvocationAttributeNameState)
        break
      case is(Unicode.LeftParenthesis)(c):
        this.getToken(TagToken).startNewInvocationAttribute()
        this.switchTo(this.expressionOrInvocationAttributeNameState)
        break
      default:
        this.getToken(TagToken).startNewPlainAttribute()
        this.reconsumeIn(this.plainAttributeNameState)
    }
  }

  // region Plain attribute

  /**
   * Based on § 8.2.4.33.
   *
   * Similar to tag name, we do not lowercase the attribute name.
   *
   * Another deviation from the spec is that we don't check if the values are duplicated.
   * We move this to a different stage since we'll be fiddling them a lot anyway. Better
   * not slow down and over-complicate the tokenizer.
   */
  private plainAttributeNameState: State = () => {
    const c = this.consume()
    switch (true) {
      case isSpaceCharacter(c):
        this.getToken(TagToken).getAttribute(PlainAttribute).declareBoolean()
      // fallthrough
      case is(Unicode.Solidus)(c):
      case is(Unicode.GreaterThanSign)(c):
      case isEof(c):
        this.reconsumeIn(this.afterPlainAttributeNameState)
        break
      case is(Unicode.EqualsSign)(c):
        this.switchTo(this.beforePlainAttributeValueState)
        break
      case is(Unicode.QuotationMark)(c):
      case is(Unicode.Apostrophe)(c):
      case is(Unicode.LessThanSign)(c):
      case is(Unicode.LeftSquareBracket)(c):
      case is(Unicode.RightSquareBracket)(c):
      case is(Unicode.LeftCurlyBracket)(c):
      case is(Unicode.RightCurlyBracket)(c):
        this.parseError()
        this.getToken(TagToken).getAttribute(PlainAttribute).appendToName(c as string)
        break
      default:
        this.getToken(TagToken).getAttribute(PlainAttribute).appendToName(c as string)
    }
  }

  /**
   * Based on § 8.2.4.34.
   */
  private afterPlainAttributeNameState: State = () => {
    const c = this.consume()
    switch (true) {
      case isSpaceCharacter(c):
        // Ignore the character.
        break
      case is(Unicode.Solidus)(c):
        this.switchTo(this.selfClosingStartTagState)
        break
      case is(Unicode.EqualsSign)(c):
        this.switchTo(this.beforePlainAttributeValueState)
        break
      case is(Unicode.GreaterThanSign)(c):
        this.emit()
        this.switchTo(this.dataState)
        break
      case isEof(c):
        this.parseError()
        this.emitEof()
        break
      default:
        this.getToken(TagToken).startNewPlainAttribute()
        this.reconsumeIn(this.plainAttributeNameState)
    }
  }

  /**
   * Based on § 8.2.4.35.
   *
   * Wane templates force values to be wrapped in quotes, so we tweak this state according to that.
   */
  private beforePlainAttributeValueState: State = () => {
    const c = this.consume()
    switch (true) {
      case isSpaceCharacter(c):
        // Ignore the character.
        break
      case is(Unicode.QuotationMark)(c):
        this.switchTo(this.plainAttributeValueState)
        break
      default:
        this.parseError()
        this.reconsumeIn(this.plainAttributeValueState)
      // TODO: I don't know how to handle this error
    }
  }

  /**
   * Based on § 8.2.4.36, 37, 38 and 39.
   *
   * We don't handle character reference here because it will be handled by the browser anyway.
   */
  private plainAttributeValueState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.QuotationMark)(c):
        this.switchTo(this.afterAttributeValueState)
        break
      case isEof(c):
        this.parseError()
        this.emitEof()
        break
      default:
        this.getToken(TagToken).getAttribute(PlainAttribute).appendToValue(c as string)
    }
  }

  /**
   * Based on § 8.2.4.39.
   */
  private afterAttributeValueState: State = () => {
    const c = this.consume()
    switch (true) {
      case isSpaceCharacter(c):
        this.switchTo(this.beforeAttributeNameState)
        break
      case is(Unicode.Solidus)(c):
        this.switchTo(this.selfClosingStartTagState)
        break
      case is(Unicode.GreaterThanSign)(c):
        this.emit()
        this.switchTo(this.dataState)
        break
      case isEof(c):
        this.parseError()
        this.emitEof()
        break
      default:
        this.parseError()
        this.reconsumeIn(this.beforeAttributeNameState)
    }
  }

  // endregion Plain attribute

  // region Expression or invocation attribute

  /**
   * @description
   *
   * In order not to repeat all states twice (expressionAttributeNameState, invocationAttributeNameState),
   * they are merged together. States peek into
   *
   * The logic still operates as if these are different state. It's an implementation detail that pairs
   * have been merged together.
   *
   * The structure of these states mirrors the analogous Plain Attribute states, while handling the
   * square brackets or parenthesis surrounding the attribute value. Another notable exception is usage
   * of sub-states for Wane Template Statement.
   *
   * Note that the FSM doesn't care whether particular usage of Wane Template Statement is allowed or not
   * in a concrete Expression or Invocation Attribute (or even Interpolation Value). For example,
   * usage of Formatters is allowed only in Interpolation, and method invocations are allowed only in
   * Invocation attributes -- however, these errors are handled in a later phase.
   */

  /**
   * Wane Template Syntax specific state.
   *
   * We've recognized a `[` or `(` while waiting for attributes and created an appropriate attribute
   * in the current tag.
   */
  private expressionOrInvocationAttributeNameState: State = () => {
    const c = this.consume()
    switch (true) {
      case isAttributeNameCharacter(c):
        this.getToken(TagToken).getAttribute(NonPlainAttribute).appendToName(c as string)
        break
      case is(Unicode.RightSquareBracket)(c):
        if (!this.getToken(TagToken).isExpressionAttribute()) {
          this.parseError() // unmatched wrappers for attribute name
        }
        this.switchTo(this.afterExpressionOrInvocationAttributeNameState)
        break
      case is(Unicode.RightParenthesis)(c):
        if (!this.getToken(TagToken).isInvocationAttribute()) {
          this.parseError() // unmatched wrappers for attribute name
        }
        this.switchTo(this.afterExpressionOrInvocationAttributeNameState)
        break
      default:
        this.parseError()
        this.getToken(TagToken).getAttribute(NonPlainAttribute).appendToName(c as string)
    }
  }

  /**
   * Wane Template Syntax specific state.
   *
   * We've recognized `[name]` or `(name)` and now we're expecting an equals sign. Anything else
   * is a syntax error
   */
  private afterExpressionOrInvocationAttributeNameState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.EqualsSign)(c):
        this.switchTo(this.beforeExpressionOrInvocationAttributeValueState)
        break
      default:
        this.parseError()
        this.switchTo(this.afterPlainAttributeNameState)
    }
  }

  /**
   * Wane Template Syntax specific state.
   *
   * We've recognized `[name]=` or `(name)=` and we're expecting a quote. Anything else is a
   * syntax error. e
   */
  private beforeExpressionOrInvocationAttributeValueState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.QuotationMark)(c):
        this.switchTo(this.expressionOrInvocationAttributeValueState)
        break
      default:
        this.parseError()
        this.switchTo(this.afterAttributeValueState)
    }
  }

  /**
   * Wane Template Syntax specific state.
   *
   * We've recognized `[name]="` or `(name)="` the first time we entered it.
   * As we loop through it, we collect more characters: `[name]="value` or `(name)="value`.
   * We keep collecting until we see a `"`.
   */
  private expressionOrInvocationAttributeValueState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.QuotationMark)(c):
        this.switchTo(this.afterAttributeValueState)
        break
      case isEof(c):
        this.parseError()
        this.emit()
        this.emitEof()
        break
      default:
        this.getToken(TagToken).getAttribute(NonPlainAttribute).appendToValue(c as string)
    }
  }

  // endregion Expression or invocation attribute

  // region Self-closing tag

  /**
   * Based on § 8.2.4.40.
   */
  private selfClosingStartTagState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.GreaterThanSign)(c):
        this.getToken(TagToken).declareSelfClosing()
        this.emit()
        this.switchTo(this.dataState)
        break
      case isEof(c):
        this.parseError()
        this.emitEof()
        break
      default:
        this.parseError()
        this.reconsumeIn(this.beforeAttributeNameState)
    }
  }

  // endregion Self-closing tag

  // region Comments-related states

  /**
   * Based on § 8.2.4.41.
   */
  private bogusCommentState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.GreaterThanSign)(c):
        this.emit()
        this.switchTo(this.dataState)
        break
      case isEof(c):
        this.emit()
        this.emitEof()
        break
      default:
        this.getToken(CommentToken).appendData(c as string)
    }
  }

  /**
   * Based on § 8.2.4.42.
   *
   * This is the weirdest state of all.
   *
   * At this point, we have "<!" recognized after we've moved away from "data" state.
   *
   * We highly derive from the HTML spec here since we only care for the comments.
   * This is why the name makes little sense, but it's easier to name it according to the spec.
   */
  private markupDeclarationOpenState: State = () => {
    if (this.lookahead([Unicode.HyphenMinus, Unicode.HyphenMinus].join(''))) {
      this.consume()
      this.consume()
      this.create(new CommentToken(), '<!'.length)
      this.switchTo(this.commentStartState)
    } else {
      this.parseError()
      this.create(new CommentToken().declareBogus(), '<!'.length)
      this.switchTo(this.bogusCommentState)
    }
  }

  /**
   * Based on § 8.2.4.43.
   */
  private commentStartState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.HyphenMinus)(c):
        this.switchTo(this.commentStartDashState)
        break
      case is(Unicode.GreaterThanSign)(c):
        this.parseError()
        this.emit()
        this.switchTo(this.dataState)
        break
      default:
        this.reconsumeIn(this.commentState)
    }
  }

  /**
   * Based on § 8.2.4.44.
   */
  private commentStartDashState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.HyphenMinus)(c):
        this.switchTo(this.commentEndState)
        break
      case is(Unicode.GreaterThanSign)(c):
        this.parseError()
        this.emit()
        this.switchTo(this.dataState)
        break
      case isEof(c):
        this.parseError()
        this.emit()
        this.emitEof()
        break
      default:
        this.getToken(CommentToken).appendData(Unicode.HyphenMinus)
        this.reconsumeIn(this.commentState)
    }
  }

  /**
   * Based on § 8.2.4.45.
   */
  private commentState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.LessThanSign)(c):
        this.getToken(CommentToken).appendData(c as string)
        this.switchTo(this.commentLessThanSignState)
        break
      case is(Unicode.HyphenMinus)(c):
        this.switchTo(this.commentEndState)
        break
      case isEof(c):
        this.parseError()
        this.emit()
        this.emitEof()
        break
      default:
        this.getToken(CommentToken).appendData(c as string)
    }
  }

  /**
   * Based on § 8.2.4.46.
   */
  private commentLessThanSignState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.ExclamationMark)(c):
        this.getToken(CommentToken).appendData(c as string)
        this.switchTo(this.commentLessThanSignBangState)
        break
      case is(Unicode.LessThanSign)(c):
        this.getToken(CommentToken).appendData(c as string)
        break
      default:
        this.reconsumeIn(this.commentState)
    }
  }

  /**
   * Based on § 8.2.4.47.
   */
  private commentLessThanSignBangState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.HyphenMinus)(c):
        this.switchTo(this.commentLessThanSignBangDashState)
        break
      default:
        this.reconsumeIn(this.commentState)
    }
  }

  /**
   * Based on § 8.2.4.48.
   */
  private commentLessThanSignBangDashState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.HyphenMinus)(c):
        this.switchTo(this.commentLessThanSignBangDashDashState)
        break
      default:
        this.reconsumeIn(this.commentState)
    }
  }

  /**
   * Based on § 8.2.4.49.
   */
  private commentLessThanSignBangDashDashState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.GreaterThanSign)(c):
      case isEof(c):
        this.reconsumeIn(this.commentEndState)
        break
      default:
        this.parseError()
        this.reconsumeIn(this.commentEndState)
    }
  }

  /**
   * Based on § 8.2.4.50.
   */
  private commentEndDashState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.HyphenMinus)(c):
        this.switchTo(this.commentEndState)
        break
      case isEof(c):
        this.parseError()
        this.emit()
        this.emitEof()
        break
      default:
        this.getToken(CommentToken).appendData(Unicode.HyphenMinus)
        this.reconsumeIn(this.commentState)
    }
  }

  /**
   * Based on §8.2.4.51.
   */
  private commentEndState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.GreaterThanSign)(c):
        this.emit()
        this.switchTo(this.dataState)
        break
      case is(Unicode.ExclamationMark)(c):
        this.switchTo(this.commentEndBangState)
        break
      case is(Unicode.HyphenMinus)(c):
        this.getToken(CommentToken).appendData(Unicode.HyphenMinus)
        break
      case isEof(c):
        this.parseError()
        this.emit()
        this.emitEof()
        break
      default:
        this.getToken(CommentToken).appendData(Unicode.HyphenMinus, Unicode.HyphenMinus)
        this.reconsumeIn(this.commentState)
    }
  }

  /**
   * Based on 8.2.4.52.
   */
  private commentEndBangState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.HyphenMinus)(c):
        this.getToken(CommentToken).appendData(Unicode.HyphenMinus, Unicode.HyphenMinus, Unicode.ExclamationMark)
        this.switchTo(this.commentEndDashState)
        break
      case is(Unicode.GreaterThanSign)(c):
        this.parseError()
        this.emit()
        this.switchTo(this.dataState)
        break
      case isEof(c):
        this.parseError()
        this.emit()
        this.emitEof()
        break
      default:
        this.getToken(CommentToken).appendData(Unicode.HyphenMinus, Unicode.HyphenMinus, Unicode.ExclamationMark)
        this.reconsumeIn(this.commentState)
    }
  }

  // endregion Comments-related states

  // region Interpolation

  /**
   * Wane Template Syntax state.
   *
   * We've seen a single "{" while in data and we're still not sure if this is just a regular character.
   *
   * If this ever turns out to be too complex or creates issues for some reason,
   * an alternative is to treat a single { (and then a single }) as well as a parser error.
   * We could force authors to use &lbrace; or &lcub; (and &rbrace; and &rcub;).
   */
  private dataLeftCurlyBraceState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.LeftCurlyBracket)(c):
        this.create(new InterpolationToken(), '{'.length)
        this.switchTo(this.collectingInterpolationState)
        break
      default:
        this.emitChar(Unicode.LeftCurlyBracket)
        this.switchTo(this.dataState)
    }
  }

  private collectingInterpolationState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.RightCurlyBracket)(c):
        this.switchTo(this.seenRightCurlyBraceInInterpolationState)
        break
      default:
        this.getToken(InterpolationToken).appendData(c as string)
    }
  }

  private seenRightCurlyBraceInInterpolationState: State = () => {
    const c = this.consume()
    switch (true) {
      case is(Unicode.RightCurlyBracket)(c):
        this.emit()
        this.switchTo(this.dataState)
        break
      default:
        // the previous { was a false alarm, so it's part of the interpolation
        this.getToken(InterpolationToken).appendData('}')
        this.getToken(InterpolationToken).appendData(c as string)
    }
  }

  // endregion Interpolation

  protected startState: State = this.dataState

  // region Helpers

  /**
   * A shorter way to create a CharacterToken and immediately emit it.
   *
   * @param {string} character The data to fill CharacterToken with.
   * @param {number} offset Easily add a character "with delay".
   * @returns {this} For fluid API.
   */
  private emitChar (character: string, offset: number = 0): this {
    console.assert(character.length == 1, `emitChar character must be of length 1.`)
    const token = new CharacterToken(character)
      .setStart(this.getIndex() - offset)
      .setEnd(this.getIndex() - offset + 1)
    this.create(token).emit()
    return this
  }

  // endregion Helpers

}
