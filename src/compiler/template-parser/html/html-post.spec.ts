import {Forest, TreeNode} from '../../utils/tree'
import {TemplateNodeHtmlValue, TemplateNodeInterpolationValue} from '../../template-nodes'
import {InterpolationBinding} from '../../template-nodes/view-bindings'
import {ViewBoundConstant, ViewBoundPropertyAccess} from '../../template-nodes/view-bound-value'
import {position} from './html.spec'
import {removeWhitespaceNodes} from './html-post'
import {TemplateNodeValue} from '../../template-nodes/nodes/template-node-value-base'
import {parseTemplate} from './html'

describe(`removeWhitespaceNodes`, () => {

  it(`should remove whitespace from simple interpolation`, () => {
    const html = `
      {{ foo }}
    `
    const actual = removeWhitespaceNodes(parseTemplate(html))
    const expected = new Forest([
      new TreeNode(
        new TemplateNodeInterpolationValue(
          new InterpolationBinding(
            new ViewBoundPropertyAccess('foo'),
          ),
          {
            type: 'text',
            content: html,
            position: position(0, 0, 0, 21, 2, 4),
          },
        ),
      ),
    ])
    expect(actual).toEqual(expected)
  })

  it(`should remove whitespace between elements`, () => {
    const html = `
      <div>
        <span>a</span>
        <span>b</span>
      </div>
`
    const actual = removeWhitespaceNodes(parseTemplate(html))

    const himalayaA = {
      type: 'text' as 'text',
      content: `a`,
      position: position(27, 2, 14, 28, 2, 15),
    }

    const himalayaB = {
      type: 'text' as 'text',
      content: `b`,
      position: position(27, 0, 0, 0, 0, 0),
    }

    const a = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundConstant(`'a'`),
      ),
      himalayaA,
    )

    const b = new TemplateNodeInterpolationValue(
      new InterpolationBinding(
        new ViewBoundConstant(`'b'`),
      ),
      himalayaB,
    )

    const himalayaSpanA = {
      type: 'element' as 'element',
      tagName: 'span',
      attributes: [],
      position: position(21, 2, 8, 35, 2, 22),
      children: [himalayaA],
    }

    const himalayaSpanB = {
      type: 'element' as 'element',
      tagName: 'span',
      attributes: [],
      position: position(0, 0, 0, 0, 0, 0),
      children: [himalayaB],
    }

    const spanA = new TemplateNodeHtmlValue(
      'span',
      new Set(),
      new Set(),
      new Set(),
      himalayaSpanA,
    )

    const spanB = new TemplateNodeHtmlValue(
      'span',
      new Set(),
      new Set(),
      new Set(),
      himalayaSpanB,
    )

    const expected = new Forest([
      new TreeNode(
        new TemplateNodeHtmlValue(
          'div',
          new Set(),
          new Set(),
          new Set(),
          {
            type: 'element',
            tagName: 'div',
            attributes: [],
            position: position(7, 1, 7, 71, 4, 12),
            children: [
              himalayaSpanA,
              himalayaSpanB,
            ],
          },
        ),
        [
          new TreeNode<TemplateNodeValue>(spanA, [new TreeNode(a)]),
          new TreeNode<TemplateNodeValue>(spanB, [new TreeNode(b)]),
        ],
      ),
    ])

    expect(actual.printIndented()).toEqual(expected.printIndented())
  })

})
