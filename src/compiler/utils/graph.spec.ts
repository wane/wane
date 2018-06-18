import {TreeNode} from './tree'
import {getPath, printTreePath} from './graph'

function getNeighbors (node: TreeNode<number>): Iterable<TreeNode<number>> {
  const neighbors: TreeNode<number>[] = []

  const parent = node.getParentOrUndefined()
  if (parent != null) {
    neighbors.push(parent)
  }

  neighbors.push(...node.getChildren())

  return neighbors
}

const [one, two, three, four, five, six] = [1, 2, 3, 4, 5, 6].map(n => new TreeNode(n))
one.appendChildren([
  two.appendChildren([
    three,
    four,
  ]),
  five,
])

describe(`getNeighbour (helper fn)`, () => {
  it(`works`, () => {
    expect(new Set(getNeighbors(one))).toEqual(new Set([two, five]))
    expect(new Set(getNeighbors(two))).toEqual(new Set([one, three, four]))
  })
})


describe(`getPath`, () => {

  it(`should get an empty array when going from and to the same node`, () => {
    expect(getPath(getNeighbors, two, two)).toEqual([two])
  })

  it(`should get the parent when going from child to parent`, () => {
    expect(getPath(getNeighbors, three, two)).toEqual([three, two])
  })

  it(`should get the ancestor when it's far away`, () => {
    expect(getPath(getNeighbors, three, one)).toEqual([three, two, one])
  })

  it(`should get the child`, () => {
    expect(getPath(getNeighbors, two, three)).toEqual([two, three])
  })

  it(`should get a descendant when it's far away`, () => {
    expect(getPath(getNeighbors, one, four)).toEqual([one, two, four])
  })

  it(`should get the sibling`, () => {
    expect(getPath(getNeighbors, three, four)).toEqual([three, two, four])
  })

  it(`should get a distant cousin (from older)`, () => {
    expect(getPath(getNeighbors, five, three)).toEqual([five, one, two, three])
  })

  it(`should get a distance cousin (from younger)`, () => {
    expect(getPath(getNeighbors, four, five)).toEqual([four, two, one, five])
  })

  it(`should throw if there is no path`, () => {
    expect(() => getPath(getNeighbors, one, six)).toThrow()
  })

})

describe(`printTreePath`, () => {
  const isHopToParent = (from: TreeNode<number>, to: TreeNode<number>) => from.getParentOrUndefined() == to
  const printHopToParent = () => 'parent'
  const printHopToChild = (from: TreeNode<number>, to: TreeNode<number>) => {
    const children = from.getChildren()
    const index = children.findIndex(child => child == to)
    return `children[${index}]`
  }

  it(`helpers`, () => {
    expect(isHopToParent(three, two)).toBe(true)
    expect(isHopToParent(five, one)).toBe(true)
    expect(isHopToParent(one, two)).toBe(false)
    expect(isHopToParent(three, one)).toBe(false)

    expect(printHopToChild(one, two)).toBe('children[0]')
    expect(printHopToChild(one, five)).toBe('children[1]')
  })

  const print = printTreePath.bind(null, isHopToParent, printHopToParent, printHopToChild)

  it(`should return an empty string when going from self to self`, () => {
    expect(print([two])).toBe('')
  })

  it(`works when accessing the parent`, () => {
    expect(print([three, two])).toBe('.parent')
  })

  it(`works when accessing an ancestor which is not the parent`, () => {
    expect(print([three, two, one])).toBe('.parent.parent')
  })

  it(`works when accessing the child`, () => {
    expect(print([two, three])).toBe('.children[0]')
    expect(print([two, four])).toBe('.children[1]')
  })

  it(`works when accessing a descendant which is not a child`, () => {
    expect(print([one, two, three])).toBe('.children[0].children[0]')
    expect(print([one, two, four])).toBe('.children[0].children[1]')
  })

  it(`works when accessing a sibling`, () => {
    expect(print([three, two, four])).toBe('.parent.children[1]')
  })

  it(`works when accessing a cousin`, () => {
    expect(print([four, two, one, five])).toBe('.parent.parent.children[1]')
    expect(print([five, one, two, four])).toBe('.parent.children[0].children[1]')
  })

})
