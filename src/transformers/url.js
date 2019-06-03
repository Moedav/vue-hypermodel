import Transformer from './transformer'

export default class UrlTransformer extends Transformer {
  serialize (value) {
    value = super.serialize(value)
    return value === null ? null : value.toString()
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return new URL(value)
  }
}
