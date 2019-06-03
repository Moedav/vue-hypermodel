export default class Transformer {
  constructor (defaultValue = null) {
    this.default = defaultValue
  }

  serialize (value) {
    if ([null, undefined].includes(value)) {
      value = this.default
    }

    return value
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return value
  }
}
