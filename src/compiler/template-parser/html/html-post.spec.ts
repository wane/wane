import {Forest, TreeNode} from '../../utils/tree'
import {TemplateNodeHtmlValue, TemplateNodeInterpolationValue} from '../../template-nodes'
import {InterpolationBinding} from '../../template-nodes/view-bindings'
import {ViewBoundConstant, ViewBoundPropertyAccess} from '../../template-nodes/view-bound-value'
import {position} from './html.spec'
import {removeWhitespaceNodes} from './html-post'
import {TemplateNodeValue} from '../../template-nodes/nodes/template-node-value-base'
import {parseTemplate} from './html'
import * as himalaya from '../../template-parser/html/himalaya'
import { stripIndent } from 'common-tags'

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
            type: himalaya.NodeType.Text,
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
    const actual = removeWhitespaceNodes(parseTemplate(html)).printIndented()

    const expected = stripIndent`
      [Html] <div>
        [Html] <span>
          [Text] 'a'
        [Html] <span>
          [Text] 'b'
    `

    expect(actual).toEqual(expected)
  })

})
