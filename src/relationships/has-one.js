import Relationship from './relationship'

export default class HasOne extends Relationship {
  constructor (modelName, foreignKey) {
    super(modelName)
    this.foreignKey = foreignKey
    this.type = 'hasOne'
  }
}
