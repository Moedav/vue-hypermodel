import Transformer from './transformer'

export default class LinkObjTransformer extends Transformer {
  serialize (value) {
    return null
  }

  deserialize (value) {
    if ([null, undefined].includes(value)) {
      return this.default
    }

    return value
  }
}
