export default class Record extends Object {
  constructor (store, response, model) {
    super()
    this._store = store
    this._links = {}
    this.response = response
    this._model = store._model(model)
    this.isLoaded = false
  }

  async load (relOrObj, model, options) {
    let link = relOrObj
    if (typeof link === 'string') {
      link = this._links[link]
    }
    if (link) {
      link.name = model
      const record = await this._store.find(link, null, null, Object.assign({
          headers: {
            Accept: link.type ? link.type : 'application/json',
            'Content-Type': link.type ? link.type : 'application/json'
          }
        },
        options
      ))

      return record
    }
    return {}
  }

  async loadCollection (relOrObj, model, options) {
    let link = relOrObj
    if (typeof link === 'string') {
      link = this._links[link]
    }
    if (link) {
      link.name = model

      const collection = await this._store.findAll(link, null, Object.assign({
          headers: {
            Accept: link.type ? link.type : 'application/json',
            'Content-Type': link.type ? link.type : 'application/json'
          }
        },
        options
      ))

      return collection
    }

    return {}
  }

  async selfLoad (options) {
    if (!this._model) {
      return {}
    }
    const self = this[this._model.selfAttr]
    if (self && !this.isLoaded) {
      self.name = this._model.name
      const record = await this._store.find(self, null, null, Object.assign({
          headers: {
            Accept: self.type ? self.type : 'application/json',
            'Content-Type': self.type ? self.type : 'application/json'
          }
        },
        options
      ))

      record.isLoaded = true

      return record
    }
    return {}
  }

  async put (options) {
    if (!this._model) {
      return {}
    }
    const link = this._links[this._model.linkRels['put']]
    if (link) {
      link.name = this._model.name
      const record = await this._store.update(link, this, null, Object.assign({
          headers: {
            Accept: link.type ? link.type : 'application/json',
            'Content-Type': link.type ? link.type : 'application/json'
          }
        },
        options
      ))

      return record
    }
    return {}
  }

  async delete (options) {
    if (!this._model) {
      return {}
    }
    const link = this._links[this._model.linkRels['delete']]
    if (link) {
      link.name = this._model.name
      const response = await this._store.delete(link, this, null, Object.assign({
          headers: {
            Accept: link.type ? link.type : 'application/json',
            'Content-Type': link.type ? link.type : 'application/json'
          }
        },
        options
      ))

      return response
    }
    return {}
  }
}
