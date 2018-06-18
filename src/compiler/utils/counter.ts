export function* counter () {
  let count = 0
  while (true) {
    yield count++
  }
}
