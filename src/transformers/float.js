import Transformer from './transformer'

export default class FloatTransformer extends Transformer {
  serialize (value) {
    value = super.serialize(value)
    return value === null ? null : Number.parseFloat(value)
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return Number.parseFloat(value)
  }
}
