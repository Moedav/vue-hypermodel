import Transformer from './transformer'

export default class DatetimeTransformer extends Transformer {
  serialize (value) {
    value = super.serialize(value)
    return value === null ? null : value.toISOString()
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return new Date(Date.parse(value))
  }
}
