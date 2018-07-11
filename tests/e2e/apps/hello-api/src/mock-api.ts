function sleep (duration: number) {
  return function <T> (arg: T): Promise<T> {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(arg)
      }, duration)
    })
  }
}

export function getAnswer (question: string): Promise<string> {
  return sleep(1000)(question.length % 2 == 0 ? `Yes` : `No`)
}
