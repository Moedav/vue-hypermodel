import Transformer from './transformer'

export default class LinkObjTransformer extends Transformer {
  serialize (value) {
    value = super.serialize(value)
    return value
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return value
  }
}
