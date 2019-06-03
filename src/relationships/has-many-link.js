import Relationship from './relationship'

export default class HasManyLink extends Relationship {
  constructor (attribute, modelName) {
    super(modelName)
    this.attribute = attribute
    this.type = 'hasManyLink'
  }
}
