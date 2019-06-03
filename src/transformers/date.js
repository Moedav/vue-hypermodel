import Transformer from './transformer'

export default class DateTransformer extends Transformer {
  serialize (value) {
    value = super.serialize(value)
    return value === null ? null : value.toISOString().split('T')[0]
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return new Date(Date.parse(value))
  }
}
