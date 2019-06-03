import Transformer from './transformer'

export default class DecimalTransformer extends Transformer {
  constructor (defaultValue, decimalPlaces = 2) {
    super(defaultValue)
    this.decimalPlaces = decimalPlaces
  }

  serialize (value) {
    value = super.serialize(value)
    return value === null ? null : Number.parseFloat(value).toFixed(this.decimalPlaces)
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return Number.parseFloat(value).toFixed(this.decimalPlaces)
  }
}
