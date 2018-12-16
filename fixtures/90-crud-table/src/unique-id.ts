function* createGenerator () {
  let i = 1001
  while (true) {
    yield i++
  }
}

const generator = createGenerator()

export const id = () => generator.next().value

export type Id = number
