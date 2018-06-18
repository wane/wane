import {
  getAttributeName, getElementOrComponentAttributes,
  getElementProps,
  getInputName,
  getOutputName,
  handleDirectiveFor,
  handleDirectiveIf,
  handleText,
  isAttributeBinding,
  isComponent,
  isDirective,
  isEventOrOutputBinding,
  isExplicitAttributeBinding,
  isImplicitAttributeBindingViaDash,
  isJustPropertyAccess,
  isLiteral,
  isPropertyOrInputBinding,
  parseMethodCall,
} from './html'
import * as himalaya from 'himalaya'
import { TemplateNodeHtmlValue, TemplateNodeInterpolationValue } from '../../template-nodes'
import {
  AttributeBinding,
  ConditionalViewBinding,
  HtmlElementPropBinding,
  InterpolationBinding,
  RepeatingViewBinding,
} from '../../template-nodes/view-bindings'
import {
  ViewBoundConstant,
  ViewBoundMethodCall,
  ViewBoundPlaceholder,
  ViewBoundPropertyAccess,
} from '../../template-nodes/view-bound-value'
import { TemplateNodeConditionalViewValue } from '../../template-nodes/nodes/conditional-view-node'
import { TemplateNodeRepeatingViewValue } from '../../template-nodes/nodes/repeating-view-node'
import { stripIndent } from 'common-tags'
import { TemplateNodeValue } from '../../template-nodes/nodes/template-node-value-base'
import { Forest, TreeNode } from '../../utils/tree'
import parseTemplate from './index'

function position (startIndex: number,
                   startLine: number,
                   startColumn: number,
                   endIndex: number,
                   endLine: number,
                   endColumn: number): himalaya.Element['position'] {
  return {
    start: {
      index: startIndex,
      line: startLine,
      column: startColumn,
    },
    end: {
      index: endIndex,
      line: endLine,
      column: endColumn,
    },
  }
}

const DUMMY_POSITION = position(0, 0, 0, 0, 0, 0)

describe(`isJustPropertyAccess`, () => {

  it(`returns true for "foo"`, () => {
    expect(isJustPropertyAccess(`foo`)).toBe(true)
  })

  it(`returns true for "foo.bar"`, () => {
    expect(isJustPropertyAccess(`foo.bar`)).toBe(true)
  })

  it(`returns false for relational operators`, () => {
    expect(isJustPropertyAccess(`foo==bar`)).toBe(false, `==`)
    expect(isJustPropertyAccess(`foo!=bar`)).toBe(false, `!=`)
    expect(isJustPropertyAccess(`foo===bar`)).toBe(false, `===`)
    expect(isJustPropertyAccess(`foo<bar`)).toBe(false, `<`)
    expect(isJustPropertyAccess(`foo>bar`)).toBe(false, `>`)
  })

  it(`returns false for arithmetic expressions`, () => {
    expect(isJustPropertyAccess(`foo+bar`)).toBe(false, `+`)
    expect(isJustPropertyAccess(`foo-bar`)).toBe(false, `-`)
    expect(isJustPropertyAccess(`foo/bar`)).toBe(false, `/`)
    expect(isJustPropertyAccess(`foo*bar`)).toBe(false, `*`)
  })

  it(`returns false for anything that has a space inside`, () => {
    expect(isJustPropertyAccess(` `)).toBe(false, `Single space`)
    expect(isJustPropertyAccess(`foo `)).toBe(false, `Trailing space`)
    expect(isJustPropertyAccess(`foo bar`)).toBe(false, `Space in the middle`)
  })

})

describe(`handleText`, () => {

  it(`handles a text-only string`, () => {
    const htmlNode: himalaya.Text = {
      type: 'text',
      content: `foo`,
      position: DUMMY_POSITION,
    }
    const node = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundConstant(`'foo'`),
      ),
      htmlNode,
    )
    expect(handleText(htmlNode)).toEqual([node])
  })

  it(`handles a interpolation-only string`, () => {
    const htmlNode: himalaya.Text = {
      type: 'text',
      content: `{{ foo }}`,
      position: DUMMY_POSITION,
    }
    const node = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundPropertyAccess(`foo`),
      ),
      htmlNode,
    )
    expect(handleText(htmlNode)).toEqual([node])
  })

  it(`handles a string with interpolation between text`, () => {
    const htmlNode: himalaya.Text = {
      type: 'text',
      content: `foo {{ bar }} baz`,
      position: DUMMY_POSITION,
    }
    const nodeFoo = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundConstant(`'foo '`),
      ),
      htmlNode,
    )
    const nodeBar = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundPropertyAccess(`bar`),
      ),
      htmlNode,
    )
    const nodeBaz = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundConstant(`' baz'`),
      ),
      htmlNode,
    )
    expect(handleText(htmlNode)).toEqual([nodeFoo, nodeBar, nodeBaz])
  })

  it(`handles text between two interpolations`, () => {
    const htmlNode: himalaya.Text = {
      type: 'text',
      content: `{{ foo }} bar {{ baz }}`,
      position: DUMMY_POSITION,
    }
    const nodeFoo = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundPropertyAccess(`foo`),
      ),
      htmlNode,
    )
    const nodeBar = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundConstant(`' bar '`),
      ),
      htmlNode,
    )
    const nodeBaz = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundPropertyAccess(`baz`),
      ),
      htmlNode,
    )
    expect(handleText(htmlNode)).toEqual([nodeFoo, nodeBar, nodeBaz])
  })

})

describe(`isAttribute`, () => {
  it(`says that "foo" is not an attribute (property)`, () => {
    expect(isAttributeBinding({ key: `foo`, value: `bar` })).toBe(false)
  })
  it(`says that "foo-bar" is an attribute`, () => {
    expect(isAttributeBinding({ key: `foo-bar`, value: `baz` })).toBe(true)
  })
  it(`says that "[foo]" is not an attribute (property)`, () => {
    expect(isAttributeBinding({ key: `[foo]`, value: `baz` })).toBe(false)
  })
  it(`says that "(foo)" is not an attribute (event)`, () => {
    expect(isAttributeBinding({ key: `(foo)`, value: `baz` })).toBe(false)
  })
  it(`says that "[foo-bar]" is an attribute`, () => {
    expect(isAttributeBinding({ key: `[foo-bar]`, value: `baz` })).toBe(true)
  })
  it(`says that "[attr.foo]" is an attribute`, () => {
    expect(isAttributeBinding({ key: `[attr.foo]`, value: `baz` })).toBe(true)
  })
  it(`says that "[attr.foo-bar]" is an attribute`, () => {
    expect(isAttributeBinding({ key: `[attr.foo-bar]`, value: `baz` })).toBe(true)
  })
})

describe(`isPropertyOrInputBinding`, () => {
  it(`says that "foo" is a property/input`, () => {
    expect(isPropertyOrInputBinding({ key: `foo`, value: `bar` })).toBe(true)
  })
  it(`says that "foo-bar" is not a property/input (an attribute)`, () => {
    expect(isPropertyOrInputBinding({ key: `foo-bar`, value: `baz` })).toBe(false)
  })
  it(`says that "[foo]" is a property/input`, () => {
    expect(isPropertyOrInputBinding({ key: `[foo]`, value: `baz` })).toBe(true)
  })
  it(`says that "(foo)" is not a property/input (event)`, () => {
    expect(isPropertyOrInputBinding({ key: `(foo)`, value: `baz` })).toBe(false)
  })
  it(`says that "[foo-bar]" is not a property/input (an attribute)`, () => {
    expect(isPropertyOrInputBinding({ key: `[foo-bar]`, value: `baz` })).toBe(false)
  })
  it(`says that "[attr.foo]" is not a property/input (an attribute)`, () => {
    expect(isPropertyOrInputBinding({ key: `[attr.foo]`, value: `baz` })).toBe(false)
  })
  it(`says that "[attr.foo-bar]" is not a property/input (an attribute)`, () => {
    expect(isPropertyOrInputBinding({ key: `[attr.foo-bar]`, value: `baz` })).toBe(false)
  })
})

describe(`isEventOrOutputBinding`, () => {
  it(`says that "foo" is not an event/output (a property/input)`, () => {
    expect(isEventOrOutputBinding({ key: `foo`, value: `bar` })).toBe(false)
  })
  it(`says that "foo-bar" is not an event/output (an attribute)`, () => {
    expect(isEventOrOutputBinding({ key: `foo-bar`, value: `baz` })).toBe(false)
  })
  it(`says that "[foo]" is not an event/output (a property/input)`, () => {
    expect(isEventOrOutputBinding({ key: `[foo]`, value: `baz` })).toBe(false)
  })
  it(`says that "(foo)" is an event/output`, () => {
    expect(isEventOrOutputBinding({ key: `(foo)`, value: `baz` })).toBe(true)
  })
  it(`says that "[foo-bar]" is not an event/output (an attribute)`, () => {
    expect(isEventOrOutputBinding({ key: `[foo-bar]`, value: `baz` })).toBe(false)
  })
  it(`says that "[attr.foo]" is not an event/output (an attribute)`, () => {
    expect(isEventOrOutputBinding({ key: `[attr.foo]`, value: `baz` })).toBe(false)
  })
  it(`says that "[attr.foo-bar]" is not an event/output (an attribute)`, () => {
    expect(isEventOrOutputBinding({ key: `[attr.foo-bar]`, value: `baz` })).toBe(false)
  })
})

describe(`getInputName`, () => {
  it(`gets input name from [foo]="bar"`, () => {
    expect(getInputName({ key: `[foo]`, value: `bar` })).toBe(`foo`)
  })
  it(`throws when given something that is not an input`, () => {
    expect(() => getInputName({ key: `(foo)`, value: `bar` })).toThrow()
  })
})

describe(`isExplicitAttributeBinding`, () => {
  it(`says that [attr.foo]="bar" is explicit attribute binding`, () => {
    expect(isExplicitAttributeBinding({ key: `[attr.foo]`, value: `bar` })).toBe(true)
  })
  it(`says that [foo]="bar" is not`, () => {
    expect(isExplicitAttributeBinding({ key: `[foo]`, value: `bar` })).toBe(false)
  })
  it(`says that [attr]="bar" is not`, () => {
    expect(isExplicitAttributeBinding({ key: `[attr]`, value: `bar` })).toBe(false)
  })
  it(`says that [data-foo]="bar" is not`, () => {
    expect(isExplicitAttributeBinding({ key: `[data-foo]`, value: `bar` })).toBe(false)
  })
})

describe(`isImplicitAttributeBindingViaDash`, () => {
  it(`says that [data-foo]="bar" is implicit attribute binding`, () => {
    expect(isImplicitAttributeBindingViaDash({ key: `[data-foo]`, value: `bar` })).toBe(true)
  })
  it(`says that [foo]="bar" is not implicit attribute binding`, () => {
    expect(isImplicitAttributeBindingViaDash({ key: `[foo]`, value: `bar` })).toBe(false)
  })
  it(`says that [attr.foo]="bar" is not implicit attribute binding`, () => {
    expect(isImplicitAttributeBindingViaDash({ key: `[attr.foo]`, value: `bar` })).toBe(false)
  })
})

describe(`getAttributeName`, () => {
  it(`should get attribute name from an explicit attribute binding`, () => {
    expect(getAttributeName({ key: `[attr.foo]`, value: `bar` })).toBe(`foo`)
  })
  it(`should get attribute name from an implicit attribute binding via dash`, () => {
    expect(getAttributeName({ key: `[foo-bar]`, value: `baz` })).toBe(`foo-bar`)
  })
  it(`should throw if the thing is not attribute binding at all (is input)`, () => {
    expect(() => getAttributeName({ key: `[foo]`, value: `bar` })).toThrow()
  })
  it(`should throw if the thing is not attribute binding at all (is output)`, () => {
    expect(() => getAttributeName({ key: `(foo)`, value: `bar` })).toThrow()
  })
})

describe(`getOutputName`, () => {
  it(`strips parans`, () => {
    expect(getOutputName({ key: `(foo)`, value: `bar` })).toBe(`foo`)
  })
  it(`throws if the passed thing is not an output`, () => {
    expect(() => getOutputName({ key: `foo`, value: `bar` })).toThrow()
  })
})

describe(`isDirective`, () => {
  it(`says that tag name is a directive if it starts with w:`, () => {
    expect(isDirective(`w:if`))
  })
  it(`says that case does not matter so W: is accepted s well`, () => {
    expect(isDirective(`W:if`))
  })
  it(`doesn't like any letter other than w`, () => {
    expect(isDirective(`v:if`)).toBe(false)
  })
  it(`required a dash`, () => {
    expect(isDirective(`wif`)).toBe(false)
  })
})

describe(`isComponent`, () => {
  it(`says that tag name is a component if it contains a dash`, () => {
    expect(isComponent(`tag-name`)).toBe(true)
  })
  it(`says that tag name isn't a component if it doesn't contain a dash`, () => {
    expect(isComponent(`tagName`)).toBe(false)
    expect(isComponent(`div`)).toBe(false)
  })
})

describe(`handleDirectiveIf`, () => {
  it(`understands a regular condition`, () => {
    const templateNode: himalaya.Element = {
      position: DUMMY_POSITION,
      type: 'element',
      children: [],
      attributes: [{ key: `foo`, value: null }],
      tagName: `w:if`,
    }
    expect(handleDirectiveIf(templateNode)).toEqual(
      new TemplateNodeConditionalViewValue(
        new ConditionalViewBinding(
          new ViewBoundPropertyAccess(`foo`),
          false,
        ),
        templateNode,
      ))
  })
  it(`understands a negative condition`, () => {
    const templateNode: himalaya.Element = {
      position: DUMMY_POSITION,
      type: 'element',
      children: [],
      attributes: [{ key: `!foo`, value: null }],
      tagName: `w:if`,
    }
    expect(handleDirectiveIf(templateNode)).toEqual(
      new TemplateNodeConditionalViewValue(
        new ConditionalViewBinding(
          new ViewBoundPropertyAccess(`foo`),
          true,
        ),
        templateNode,
      ))
  })
  it(`allows dot notation`, () => {
    const templateNode: himalaya.Element = {
      position: DUMMY_POSITION,
      type: 'element',
      children: [],
      attributes: [{ key: `foo.bar.baz`, value: null }],
      tagName: `w:if`,
    }
    expect(handleDirectiveIf(templateNode)).toEqual(
      new TemplateNodeConditionalViewValue(
        new ConditionalViewBinding(
          new ViewBoundPropertyAccess(`foo.bar.baz`),
          false,
        ),
        templateNode,
      ))
  })
  it(`throws if there is no condition`, () => {
    const templateNode: himalaya.Element = {
      position: DUMMY_POSITION,
      type: 'element',
      children: [],
      attributes: [],
      tagName: `w:if`,
    }
    expect(() => handleDirectiveIf(templateNode)).toThrow()
  })
})

describe(`handleDirectiveFor`, () => {
  it(`handles a usual case of simple iteration`, () => {
    const templateNode: himalaya.Element = {
      position: DUMMY_POSITION,
      type: 'element',
      children: [],
      attributes: [
        { key: `item`, value: null },
        { key: `of`, value: null },
        { key: `items`, value: null },
      ],
      tagName: `w:for`,
    }
    expect(handleDirectiveFor(templateNode)).toEqual(
      new TemplateNodeRepeatingViewValue(
        new RepeatingViewBinding(
          new ViewBoundPropertyAccess(`items`),
          `item`,
          undefined,
          undefined,
        ),
        templateNode,
      ),
    )
  })
  it(`handles utilizing index variable`, () => {
    const templateNode: himalaya.Element = {
      position: DUMMY_POSITION,
      type: 'element',
      children: [],
      attributes: [
        { key: `(item,`, value: null },
        { key: `index)`, value: null },
        { key: `of`, value: null },
        { key: `items`, value: null },
      ],
      tagName: `w:for`,
    }
    expect(handleDirectiveFor(templateNode)).toEqual(
      new TemplateNodeRepeatingViewValue(
        new RepeatingViewBinding(
          new ViewBoundPropertyAccess(`items`),
          `item`,
          `index`,
          undefined,
        ),
        templateNode,
      ),
    )
  })
  it(`handles passing in a key`, () => {
    const templateNode: himalaya.Element = {
      position: DUMMY_POSITION,
      type: 'element',
      children: [],
      attributes: [
        { key: `item`, value: null },
        { key: `of`, value: null },
        { key: `items;`, value: null },
        { key: `key:`, value: null },
        { key: `foo`, value: null },
      ],
      tagName: `w:for`,
    }
    expect(handleDirectiveFor(templateNode)).toEqual(
      new TemplateNodeRepeatingViewValue(
        new RepeatingViewBinding(
          new ViewBoundPropertyAccess(`items`),
          `item`,
          undefined,
          `foo`,
        ),
        templateNode,
      ),
    )
  })
  it(`handles both index and key at the same time`, () => {
    const templateNode: himalaya.Element = {
      position: DUMMY_POSITION,
      type: 'element',
      children: [],
      attributes: [
        { key: `(item,`, value: null },
        { key: `index)`, value: null },
        { key: `of`, value: null },
        { key: `items;`, value: null },
        { key: `key:`, value: null },
        { key: `foo`, value: null },
      ],
      tagName: `w:for`,
    }
    expect(handleDirectiveFor(templateNode)).toEqual(
      new TemplateNodeRepeatingViewValue(
        new RepeatingViewBinding(
          new ViewBoundPropertyAccess(`items`),
          `item`,
          `index`,
          `foo`,
        ),
        templateNode,
      ),
    )
  })
})

describe(`isLiteral`, () => {
  it(`says that "undefined" is a literal`, () => {
    expect(isLiteral(`undefined`)).toBe(true)
  })
  it(`says that "null" is a literal`, () => {
    expect(isLiteral(`null`)).toBe(true)
  })
  it(`says that "true" and "false" are literals`, () => {
    expect(isLiteral(`true`)).toBe(true, `tru`)
    expect(isLiteral(`false`)).toBe(true, `false`)
  })
  it(`says that a string with single quotes is a literal`, () => {
    expect(isLiteral(`'foo'`)).toBe(true)
  })
  it(`says that a string with double quotes is a literal`, () => {
    expect(isLiteral(`"foo"`)).toBe(true)
  })
  it(`says that a number is a literal`, () => {
    expect(isLiteral(`1`)).toBe(true)
  })
  it(`says that a random thing is not a literal`, () => {
    expect(isLiteral(`foo`)).toBe(false)
  })
})

describe(`getElementOrComponentAttributes`, () => {
  it(`gets a simple aria prop from an html element`, () => {
    const himalayaNode: himalaya.Element = {
      type: 'element',
      tagName: `div`,
      attributes: [
        { key: `aria-label`, value: `foo` },
      ],
      children: [],
      position: DUMMY_POSITION,
    }
    const htmlElementAttrBindings = new Set([
      new AttributeBinding(
        `aria-label`,
        new ViewBoundConstant(`'foo'`),
      ),
    ])
    expect(getElementOrComponentAttributes(himalayaNode)).toEqual(htmlElementAttrBindings)
  })
})

describe(`getElementProps`, () => {
  it(`should get a simple usual prop`, () => {
    const himalayaNode: himalaya.Element = {
      type: 'element',
      tagName: `div`,
      attributes: [
        { key: `class`, value: `bar` },
      ],
      children: [],
      position: DUMMY_POSITION,
    }
    const htmlElementPropBindings = new Set([
      new HtmlElementPropBinding(
        `class`,
        new ViewBoundConstant(`'bar'`),
      ),
    ])
    expect(getElementProps(himalayaNode)).toEqual(htmlElementPropBindings)
  })
  it(`should get a single prop bound as literal`, () => {
    const himalayaNode: himalaya.Element = {
      type: 'element',
      tagName: `div`,
      attributes: [
        { key: `[class]`, value: `'bar'` },
      ],
      children: [],
      position: DUMMY_POSITION,
    }
    const htmlElementPropBindings = new Set([
      new HtmlElementPropBinding(
        `class`,
        new ViewBoundConstant(`'bar'`),
      ),
    ])
    expect(getElementProps(himalayaNode)).toEqual(htmlElementPropBindings)
  })
  it(`should get a single prop bound to a class prop`, () => {
    const himalayaNode: himalaya.Element = {
      type: 'element',
      tagName: `div`,
      attributes: [
        { key: `[class]`, value: `foo.bar` },
      ],
      children: [],
      position: DUMMY_POSITION,
    }
    const htmlElementPropBindings = new Set([
      new HtmlElementPropBinding(
        `class`,
        new ViewBoundPropertyAccess(`foo.bar`),
      ),
    ])
    expect(getElementProps(himalayaNode)).toEqual(htmlElementPropBindings)
  })
  it(`should get prop binding as a string`, () => {
    const himalayaNode: himalaya.Element = {
      type: 'element',
      tagName: 'div',
      attributes: [
        { key: `class`, value: `foo` },
      ],
      children: [],
      position: DUMMY_POSITION,
    }
    const htmlElementPropBindings = new Set([
      new HtmlElementPropBinding(
        `class`,
        new ViewBoundConstant(`'foo'`),
      )
    ])
    expect(getElementProps(himalayaNode)).toEqual(htmlElementPropBindings)
  })
  it(`should not get an output`, () => {

  })
})

describe(`parseMethodCall`, () => {

  const parse = (str: string) => parseMethodCall(str, DUMMY_POSITION)

  it(`handles a simple method call without arguments "foo()"`, () => {
    expect(parse(`foo()`)).toEqual(new ViewBoundMethodCall(`foo`, []))
  })

  it(`handles a simple method call with some whitespace "foo ()"`, () => {
    expect(parse(`foo()`)).toEqual(new ViewBoundMethodCall(`foo`, []))
  })

  it(`handles a method call with a placeholder "foo(#)"`, () => {
    expect(parse(`foo(#)`)).toEqual(new ViewBoundMethodCall(`foo`, [
      new ViewBoundPlaceholder(),
    ]))
  })

  it(`handles a method call with a constant "foo(1)`, () => {
    expect(parse(`foo(1)`)).toEqual(new ViewBoundMethodCall(`foo`, [
      new ViewBoundConstant(`1`),
    ]))
  })

  // xit(`handles a method call with a reference "foo(bar)"`, () => {
  //
  // })
  //
  // xit(`handles a method call with multiple arguments "foo(bar, 1, #, baz)`, () => {
  //
  // })
  //
  // xit(`reports an error if only a method reference is given "foo"`, () => {
  //
  // })
  //
  // xit(`reports an error if there is only an opening paran "foo("`, () => {
  //
  // })
  //
  // xit(`reports n error if there is another identifier before the call "foo bar()"`, () => {
  //
  // })
  //
  // xit(`reports an error if there is another identifier after the call "foo() bar"`, () => {
  //
  // })
  //
  // xit(`reports an error if there are only parans "()"`, () => {
  //
  // })
  //
  // xit(`reports an error if there are multiple identifiers in parans without commas between "foo(bar baz)"`, () => {
  //
  // })
  //
  // xit(`reports an error if there is a syntax error "foo('1)"`, () => {
  //
  // })
  //
  // xit(`reports an error if there are two commas in a row "foo(foo,,bar)"`, () => {
  //
  // })

})

describe(`INTEGRATION`, () => {

  it(`should work for a basic text-only template`, () => {
    const template = stripIndent`
      foo bar baz
    `
    const forest = new Forest<TemplateNodeValue>([
      new TreeNode(
        new TemplateNodeInterpolationValue(
          new InterpolationBinding(
            new ViewBoundConstant(`'foo bar baz'`),
          ),
          {
            type: 'text',
            content: `foo bar baz`,
            position: position(0, 0, 0, 11, 0, 11),
          },
        ),
      ),
    ])
    expect(parseTemplate(template)).toEqual(forest)
  })

  it(`should work for a simple wrapper around text and interpolation`, () => {
    const template = stripIndent`
      foo
      <div class="bar">
        baz {{ qux }}
      </div>
    `
    const forest = new Forest<TemplateNodeValue>([
      new TreeNode<TemplateNodeValue>(
        new TemplateNodeInterpolationValue(
          new InterpolationBinding(
            new ViewBoundConstant(`'foo\\n'`),
          ),
          {
            type: 'text',
            content: `foo\n`,
            position: position(0, 0, 0, 4, 1, 0),
          },
        ),
      ),
      new TreeNode<TemplateNodeValue>(
        new TemplateNodeHtmlValue(
          `div`,
          new Set([]),
          new Set([
            new HtmlElementPropBinding(
              `class`,
              new ViewBoundConstant(`'bar'`),
            ),
          ]),
          new Set([]),
          {
            type: 'element',
            tagName: `div`,
            attributes: [{ key: `class`, value: `bar` }],
            children: [
              {
                type: 'text',
                content: `\n  baz {{ qux }}\n`,
                position: position(21, 1, 17, 38, 3, 0),
              },
            ],
            position: position(4, 1, 0, 44, 3, 6),
          },
        ),
        [
          new TreeNode<TemplateNodeValue>(
            new TemplateNodeInterpolationValue(
              new InterpolationBinding(
                new ViewBoundConstant(`'\\n  baz '`),
              ),
              {
                type: 'text',
                content: `\n  baz {{ qux }}\n`,
                position: position(21, 1, 17, 38, 3, 0),
              },
            ),
          ),
          new TreeNode<TemplateNodeValue>(
            new TemplateNodeInterpolationValue(
              new InterpolationBinding(
                new ViewBoundPropertyAccess(`qux`),
              ),
              {
                type: 'text',
                content: `\n  baz {{ qux }}\n`,
                position: position(21, 1, 17, 38, 3, 0),
              },
            ),
          ),
          new TreeNode<TemplateNodeValue>(
            new TemplateNodeInterpolationValue(
              new InterpolationBinding(
                new ViewBoundConstant(`'\\n'`),
              ),
              {
                type: 'text',
                content: `\n  baz {{ qux }}\n`,
                position: position(21, 1, 17, 38, 3, 0),
              },
            ),
          ),
        ],
      ),
    ])
    expect(parseTemplate(template)).toEqual(forest)
  })

  // it(`should work for some nested html elements and components`, () => {
  //
  // })

})
