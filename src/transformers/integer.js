import Transformer from './transformer'

export default class IntegerTransformer extends Transformer {
  serialize (value) {
    value = super.serialize(value)
    return value === null ? null : Number.parseInt(value)
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return Number.parseInt(value)
  }
}
