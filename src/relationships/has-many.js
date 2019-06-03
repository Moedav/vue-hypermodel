import Relationship from './relationship'

export default class HasMany extends Relationship {
  constructor (modelName, foreignKey) {
    super(modelName)
    this.type = 'hasMany'
  }
}
