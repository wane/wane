import * as csstree from 'css-tree'

function isChunkSeparator (node: any) {
  return node.type == 'Combinator' || node.type == 'WhiteSpace'
}

function isUniversalSelector (node: any) {
  return node.type == 'TypeSelector' && node.name == '*'
}

export function encapsulate (uniqueId: number, tagName: string, inputString: string): string {
  const ast = csstree.parse(inputString)

  const attributeName = `data-w-${uniqueId}`

  const dataToInsert = {
    type: 'AttributeSelector',
    loc: null,
    name: {
      type: 'Identifier',
      loc: null,
      name: attributeName,
    },
    matcher: null,
    value: null,
    flags: null,
  }

  csstree.walk(ast, {
    visit: 'Rule',
    enter (ruleNode: any) {
      const prelude = ruleNode.prelude
      if (prelude.type != 'SelectorList') return
      const selectors = prelude.children

      selectors.each((selectorNode: any, selectorItem: any) => {
        // If the selector has ":host", we do not prepend [data-w-x],
        // but swap ":host" with the selector name.
        const hasPseudoClassHostSelector = selectorNode.children.some((node: any) => {
          return node.type == 'PseudoClassSelector' && node.name == 'host'
        })

        if (hasPseudoClassHostSelector) {
          selectorNode.children.each((node: any, item: any, list: any) => {
            if (node.type == 'PseudoClassSelector' && node.name == 'host') {
              list.insertData({
                type: 'TypeSelector',
                loc: null,
                name: tagName,
              }, item)
              list.remove(item)
            }
          })
        } else {
          let isStartOfChunk = true
          let isChunkDone = false
          selectorNode.children.each((node: any, item: any, list: any) => {
            if (isChunkDone) {
              if (isChunkSeparator(node)) {
                isStartOfChunk = true
                isChunkDone = false
              }
              return
            }

            if (isUniversalSelector(node)) {
              // We replace the universal selector with the attribute selector,
              // unless we've already done that in this chunk.
              list.insertData(dataToInsert, item)
              list.remove(item)
              isChunkDone = true
              return
            }

            if (isStartOfChunk) {
              isStartOfChunk = false
              if (node.type == 'PseudoElementSelector') {
                list.insertData(dataToInsert, item)
              } else {
                if (item.next == null) {
                  list.appendData(dataToInsert)
                } else {
                  list.insertData(dataToInsert, item.next)
                }
              }
              isChunkDone = true
              return
            }
          })
        }
      })
    },
  })

  const output = csstree.generate(ast)
  return output
}
