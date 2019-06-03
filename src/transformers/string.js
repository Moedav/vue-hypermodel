import Transformer from './transformer'

export default class StringTransformer extends Transformer {
  serialize (value) {
    value = super.serialize(value)
    return value === null ? null : String(value)
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return String(value)
  }
}
