import Relationship from './relationship'

export default class HasLink extends Relationship {
  constructor (attribute, modelName) {
    super(modelName)
    this.attribute = attribute
    this.type = 'hasLink'
  }
}
