import { Forest, TreeNode, TreeNodePojo } from './tree'

function isNumber<T extends number> (type: T): (number: number) => number is T {
  return function (number: number): number is T {
    return number == type
  }
}

describe(`TreeNode`, () => {

  describe(`Single node`, () => {

    it(`should be created`, () => {
      expect(() => {
        const node = new TreeNode(1)
      }).not.toThrow()
    })

    it(`should hold onto the value`, () => {
      const node = new TreeNode(1)
      expect(node.getValue()).toBe(1)
    })

    it(`should have no parent`, () => {
      const node = new TreeNode(1)
      expect(node.getParentOrUndefined()).toBe(null)
      expect(() => {
        node.getParent()
      }).toThrow()
    })

    it(`should have no children`, () => {
      const node = new TreeNode(1)
      expect(node.getChildren().length).toBe(0)
      expect(node.getFirstChild()).toBe(null)
      expect(node.getLastChild()).toBe(null)
    })

    it(`should have no siblings`, () => {
      const node = new TreeNode(1)
      expect(node.getNextSibling()).toBe(null)
      expect(node.getPrevSibling()).toBe(null)
    })

    it(`should iterate`, () => {
      const values: any[] = []
      const node = new TreeNode(1)
      node.forEach(n => values.push(n.getValue()))
      expect(values).toEqual([1])
    })

    it(`should print left prefix`, () => {
      const node = new TreeNode(1)
      expect(node.printLeftPrefix()).toBe(`(1)`)
    })

    it(`should print left postfix`, () => {
      const node = new TreeNode(1)
      expect(node.printLeftPostfix()).toBe(`(1)`)
    })

  })

  describe(`A tree in form (1 (2 3))`, () => {

    const root = new TreeNode(1)
    const left = new TreeNode(2)
    const right = new TreeNode(3)
    root.appendChild(left).appendChild(right)

    describe(`The root node`, () => {

      it(`should have no parent`, () => {
        expect(root.getParentOrUndefined()).toBe(null)
      })
      it(`should have its children set to 2 and 3`, () => {
        expect(root.getChildren()).toEqual([left, right])
      })
      it(`should have the first child set to 2`, () => {
        expect(root.getFirstChild()).toBe(left)
      })
      it(`should have the last child set to 3`, () => {
        expect(root.getLastChild()).toBe(right)
      })
      it(`should have no siblings`, () => {
        expect(root.getPrevSibling()).toBe(null)
        expect(root.getNextSibling()).toBe(null)
      })
      it(`should have no ancestor chain`, () => {
        expect(root.getAncestorChain().length).toBe(0)
      })

    })

    describe(`The left node`, () => {

      it(`should have its parent set to root`, () => {
        expect(left.getParentOrUndefined()).toBe(root)
      })
      it(`should have no children`, () => {
        expect(left.getChildren().length).toBe(0)
        expect(left.getFirstChild()).toBe(null)
        expect(left.getLastChild()).toBe(null)
      })
      it(`should have no previous sibling`, () => {
        expect(left.getPrevSibling()).toBe(null)
      })
      it(`should have its next sibling set to 3`, () => {
        expect(left.getNextSibling()).toBe(right)
      })
      it(`should have its ancestor chain set to [1]`, () => {
        expect(left.getAncestorChain()).toEqual([root])
      })

    })

    describe(`The right node`, () => {

      it(`should have its parent set to root`, () => {
        expect(right.getParentOrUndefined()).toBe(root)
      })
      it(`should have no children`, () => {
        expect(right.getChildren().length).toBe(0)
        expect(right.getFirstChild()).toBe(null)
        expect(right.getLastChild()).toBe(null)
      })
      it(`should have its prev sibling set to 2`, () => {
        expect(right.getPrevSibling()).toBe(left)
      })
      it(`should have no next sibling`, () => {
        expect(right.getNextSibling()).toBe(null)
      })
      it(`should have its ancestor chain set to [1]`, () => {
        expect(right.getAncestorChain()).toEqual([root])
      })

    })

    describe(`Printing`, () => {
      it(`should print left prefix`, () => {
        expect(root.printLeftPrefix()).toBe(`(1 (2 3))`)
      })
      it(`should print left postfix`, () => {
        expect(root.printLeftPostfix()).toBe(`((2 3) 1)`)
      })
      it(`should print indented`, () => {
        expect(root.printIndented()).toBe(`1\n  2\n  3`)
      })
    })

    describe(`#getDescendants`, () => {
      it(`should get 2, 3`, () => {
        const descendants = Array.from(root.getDescendants())
        expect(descendants.length).toBe(2)
        expect(descendants[0]).toBe(left)
        expect(descendants[1]).toBe(right)
      })
    })

    describe(`#getDescendantsAndSelf`, () => {
      it(`should get 1, 2, 3`, () => {
        const descendants = Array.from(root.getDescendantsAndSelf())
        expect(descendants.length).toBe(3)
        expect(descendants[0]).toBe(root)
        expect(descendants[1]).toBe(left)
        expect(descendants[2]).toBe(right)
      })
    })

    describe(`#findInDescendants`, () => {
      it(`should find in descendants`, () => {
        const two = root.findInDescendants(node => node.getValueOrThrow() == 2)
        const three = root.findInDescendants(node => node.getValueOrThrow() == 3)
        expect(two).toBe(left)
        expect(three).toBe(right)
      })
      it(`should return null if nothing is found`, () => {
        const four = root.findInDescendants(node => node.getValueOrThrow() == 4)
        expect(four).toBeNull()
      })
    })

    describe(`#findInDescendantsOrFail`, () => {
      it(`should find in descendants`, () => {
        const two = root.findInDescendantsOrFail(node => node.getValueOrThrow() == 2)
        const three = root.findInDescendantsOrFail(node => node.getValueOrThrow() == 3)
        expect(two).toBe(left)
        expect(three).toBe(right)
      })
      it(`should throw if nothing is found`, () => {
        const findFour = () => root.findInDescendantsOrFail(node => node.getValueOrThrow() == 4)
        expect(findFour).toThrow()
      })
    })

    describe(`Reading from a pojo`, () => {
      const pojo: TreeNodePojo<number> = {
        value: 1,
        children: [
          { value: 2 },
          { value: 3 },
        ],
      }
      const tree = TreeNode.fromPojo(pojo)
      it(`should be the same`, () => {
        expect(tree.printLeftPrefix()).toBe(`(1 (2 3))`)
        expect(tree.printIndented()).toBe(`1\n  2\n  3`)
      })
    })

  })

  /**
   *         4
   *       /
   *     2 - 5
   *   /   \
   * 1      6
   *  \
   *   3 - 7 - 8
   */
  describe(`A tree in form (1 (2 (4 5 6)) (3 (7 (8))))`, () => {
    const [one, two, three, four, five, six, seven, eight] = [
      1, 2, 3, 4, 5, 6, 7, 8,
    ].map(x => new TreeNode(x))

    one.appendChildren([
      two.appendChildren([
        four,
        five,
        six,
      ]),
      three.appendChildren([
        seven.appendChildren([
          eight,
        ]),
      ]),
    ])

    describe(`#getDescendants()`, () => {
      it(`should work on the (2 (4 5 6)) subtree`, () => {
        expect(Array.from(two.getDescendants())).toEqual([four, five, six])
      })
      it(`should work on the (7 (8)) subtree`, () => {
        expect(Array.from(seven.getDescendants())).toEqual([eight])
      })
      it(`should work on the (3 (7 (8)) subtree`, () => {
        expect(Array.from(three.getDescendants())).toEqual([seven, eight])
      })
      it(`should work on the whole tree`, () => {
        expect(Array.from(one.getDescendants())).toEqual([two, three, four, five, six, seven, eight])
      })
    })

    describe(`#getDescendantsAndSelf()`, () => {
      it(`should work on the (2 (4 5 6)) subtree`, () => {
        expect(Array.from(two.getDescendantsAndSelf())).toEqual([two, four, five, six])
      })
      it(`should work on the (7 (8)) subtree`, () => {
        expect(Array.from(seven.getDescendantsAndSelf())).toEqual([seven, eight])
      })
      it(`should work on the (3 (7 (8)) subtree`, () => {
        expect(Array.from(three.getDescendantsAndSelf())).toEqual([three, seven, eight])
      })
      it(`should work on the whole tree`, () => {
        expect(Array.from(one.getDescendantsAndSelf())).toEqual([one, two, three, four, five, six, seven, eight])
      })
    })

    describe(`#findInDescendants`, () => {
      it(`should find 6 as child of 2`, () => {
        expect(two.findInDescendants(node => node.getValueOrThrow() == 6)).toBe(six)
      })
      it(`should find 6 as descendant of 1`, () => {
        expect(one.findInDescendants(node => node.getValueOrThrow() == 6)).toBe(six)
      })
      it(`should not find 1 as descendant of 1`, () => {
        expect(one.findInDescendants(node => node.getValueOrThrow() == 1)).toBe(null)
      })
    })

    describe(`#findInDescendantsOrFail`, () => {
      it(`should find 6 as child of 2`, () => {
        expect(two.findInDescendantsOrFail(node => node.getValueOrThrow() == 6)).toBe(six)
      })
      it(`should find 6 as descendant of 1`, () => {
        expect(one.findInDescendantsOrFail(node => node.getValueOrThrow() == 6)).toBe(six)
      })
      it(`should not find 1 as descendant of 1`, () => {
        const findOne = () => one.findInDescendantsOrFail(node => node.getValueOrThrow() == 1)
        expect(findOne).toThrow()
      })
    })

    describe(`#findInDescendantsAndSelf and #findInDescendantsAndSelfOrFail`, () => {
      it(`should find 6 as child of 2`, () => {
        expect(two.findInDescendantsAndSelf(node => node.getValueOrThrow() == 6)).toBe(six)
        expect(two.findInDescendantsAndSelfOrFail(node => node.getValueOrThrow() == 6)).toBe(six)
      })
      it(`should find 6 as descendant of 1`, () => {
        expect(one.findInDescendantsAndSelf(node => node.getValueOrThrow() == 6)).toBe(six)
        expect(one.findInDescendantsAndSelfOrFail(node => node.getValueOrThrow() == 6)).toBe(six)
      })
      it(`should find 1 as self`, () => {
        expect(one.findInDescendantsAndSelf(node => node.getValueOrThrow() == 1)).toBe(one)
        expect(one.findInDescendantsAndSelfOrFail(node => node.getValueOrThrow() == 1)).toBe(one)
      })
      it(`should not find random shit and act accordingly`, () => {
        expect(one.findInDescendantsAndSelf(node => node.getValueOrThrow() == 100)).toBe(null)
        expect(() => one.findInDescendantsAndSelfOrFail(node => node.getValueOrThrow() == 100)).toThrow()
      })
    })

    describe(`#findValueInDescendants`, () => {
      it(`should find 6 as child of 2`, () => {
        expect(two.findValueInDescendants(v => v == 6)).toBe(six)
      })
      it(`should find 6 as descendant of 1`, () => {
        expect(one.findValueInDescendants(v => v == 6)).toBe(six)
      })
      it(`should not find 1 as descendant of 1`, () => {
        expect(one.findValueInDescendants(v => v == 1)).toBe(null)
      })
    })

    describe(`#findValueInDescendantsOrFail`, () => {
      it(`should find 6 as child of 2`, () => {
        expect(two.findValueInDescendantsOrFail(v => v == 6)).toBe(six)
      })
      it(`should find 6 as descendant of 1`, () => {
        expect(one.findValueInDescendantsOrFail(v => v == 6)).toBe(six)
      })
      it(`should not find 1 as descendant of 1`, () => {
        const findOne = () => one.findValueInDescendantsOrFail(v => v == 1)
        expect(findOne).toThrow()
      })
    })

  })

})

describe(`Forest`, () => {

  describe(`with a single root with no children (single node)`, () => {

    const one = new TreeNode(1)
    const forest = new Forest([one])

    describe(`#forEach`, () => {
      it(`should iterate over the single node`, () => {
        const arr: TreeNode<any>[] = []
        forest.forEach(node => arr.push(node))
        expect(arr).toEqual([one])
      })
    })

    describe(`#[Symbol.iterator]`, () => {
      it(`should iterate over the single node`, () => {
        const arr: TreeNode<any>[] = []
        for (const node of forest) arr.push(node)
        expect(arr).toEqual([one])
      })
    })

    describe(`#getRoots`, () => {
      it(`should return an iterable with a single element`, () => {
        const arr = Array.from(forest.getRoots())
        expect(arr).toEqual([one])
      })
    })

    describe(`#printLeftPrefix and #printLeftPostfix`, () => {
      it(`should print ( 1 ) by default`, () => {
        expect(forest.printLeftPrefix()).toEqual(`( (1) )`)
        expect(forest.printLeftPostfix()).toEqual(`( (1) )`)
      })
      it(`should honor the optional printing lambda`, () => {
        expect(forest.printLeftPrefix(v => `${v * 20}`)).toEqual(`( (20) )`)
        expect(forest.printLeftPostfix(v => `${v * 20}`)).toEqual(`( (20) )`)
      })
    })

    describe(`#printIndented`, () => {
      it(`should print 1`, () => {
        expect(forest.printIndented()).toEqual(`1`)
      })
      it(`should honor the optional printing lambda`, () => {
        expect(forest.printIndented(v => `v${v}`)).toEqual(`v1`)
      })
    })

    describe(`#find, #findOrFail, #findValue, #findValueOrFail`, () => {
      it(`should find the only node`, () => {
        expect(forest.find(n => n.getValueOrThrow() == 1)).toBe(one, `.find`)
        expect(forest.findOrFail(n => n.getValueOrThrow() == 1)).toBe(one, `.findOrFail`)
        expect(forest.findValue(v => v == 1)).toBe(one, `.findValue`)
        expect(forest.findValueOrFail(v => v == 1)).toBe(one, `.findValueOrFail`)
      })
      it(`should return null or throw, accordingly, when asking for random shit`, () => {
        expect(forest.find(n => n.getValueOrThrow() == 2)).toBe(null)
        expect(() => forest.findOrFail(n => n.getValueOrThrow() == 2)).toThrow()
        expect(forest.findValue(v => v == 2)).toBe(null)
        expect(() => forest.findValueOrFail(v => v == 2)).toThrow()
      })
    })

  })

  /**
   *             4
   *           /
   *          2 - 5
   *        / \
   * forest    6
   *       \
   *        3 - 7 - 8
   */
  describe(`in the shape of ( (2 ((4) (5) (6))) (3 (7 (8))) )`, () => {

    const [two, three, four, five, six, seven, eight] = [2, 3, 4, 5, 6, 7, 8]
      .map(n => new TreeNode(n))

    two.appendChildren([four, five, six])
    three.appendChild(seven.appendChild(eight))

    const forest = new Forest([two, three])

    describe(`#forEach`, () => {
      it(`should iterate over every node`, () => {
        const arr: TreeNode<number>[] = []
        forest.forEach(node => arr.push(node))
        expect(arr).toEqual([two, three, four, five, six, seven, eight])
      })
    })

    describe(`#[Symbol.iterator]`, () => {
      it(`should iterate over every node`, () => {
        const arr: TreeNode<number>[] = []
        for (const node of forest) arr.push(node)
        expect(arr).toEqual([two, three, four, five, six, seven, eight])
      })
    })

  })

})
