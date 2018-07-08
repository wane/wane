import { isEqual } from 'lodash'

type EchoizeCacheResultInternal = {
  index: number
  result: EchoizeCacheResult
}

export type EchoizeCacheResult = {
  isHit: false
} | {
  isHit: true
  result: any
}

export class EchoizeCache {

  private cache: [any, any][] = []

  public set (key: any[], value: any): void {
    const index = this._get(key).index
    if (index == -1) {
      this.cache.push([key, value])
    } else {
      this.cache[index] = [key, value]
    }
  }

  private _get (key: any[]): EchoizeCacheResultInternal {
    let index: number | undefined
    for (let i = 0; i < this.cache.length; i++) {
      const currKey = this.cache[i][0]
      if (isEqual(currKey, key)) {
        index = i
        break
      }
    }
    if (index === undefined) {
      return {
        index: -1,
        result: {
          isHit: false,
        },
      }
    } else {
      const value = this.cache[index][1]
      return {
        index,
        result: {
          isHit: true,
          result: value,
        },
      }
    }
  }

  public get (key: any[]): EchoizeCacheResult {
    return this._get(key).result
  }

}

export function echoize () {
  return function echoizeDecorator (
    target: any,
    propName: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const original = descriptor.value
    descriptor.value = function (...args: any[]) {

      const _this = this as { __echoize__: any }

      if (_this.__echoize__ == null) {
        _this.__echoize__ = {}
      }

      if (_this.__echoize__[propName] == null) {
        _this.__echoize__[propName] = new EchoizeCache()
      }

      const cache = _this.__echoize__[propName] as EchoizeCache
      const result = cache.get(args)

      if (result.isHit) {
        return result.result
      } else {
        const returnValue = original.call(this, ...args)
        cache.set(args, returnValue)
        return returnValue
      }

    }
  }
}
