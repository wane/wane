import * as propInfo from 'property-information'

export function getPropInfoByName (name: string): propInfo.PropInfo {
  return propInfo(name)
}

export function getPropInfoByPropName (propName: string): propInfo.PropInfo {
  const prop = propInfo.all.find(info => {
    return info.propertyName == propName
  })
  if (prop == null) {
    throw new Error(`Property "${propName}" does not exist.`)
  }
  return prop
}
