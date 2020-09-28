export default class Record extends Object {
  constructor (store, response, model) {
    super()
    this._store = store
    this._links = {}
    this.response = response
    this._model = store._model(model)
    this.isLoaded = false
  }

  async load (model, options) {
    // @TODO: Falls link (has Link) ansonsten dann über url laden.
    model = this._store._model(model)
    let link = this._links[model.link]
    if (link) {
      link.model = model
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

  async loadCollection (model, options) {
    model = this._store._model(model)
    let link = this._links[model.link]
    if (link) {
      link.model = model
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

    return []
  }

  async selfLoad (options) {
    if (!this._model) {
      return {}
    }
    const self = this[this._model.selfAttr]
    if (self) {
      self.model = this._model
      const record = await this._store.find(self, null, null, Object.assign({
          headers: {
            Accept: self.type ? self.type : 'application/json',
            'Content-Type': self.type ? self.type : 'application/json'
          }
        },
        options
      ))

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
      link.model = this._model
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
      link.model = this._model
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

  async post (relOrObj, record, model = null, options = {}) {
    let link = relOrObj
    if (typeof link === 'string') {
      link = this._links[link]
    } else if (!link) {
      link = this._links[this._model.linkRels['post']]
      record = this
    }
    if (link) {
      link.model = model || this._model
      record = await this._store.create(link, record, null, Object.assign({
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

  get (model) {
    model = this._store._model(model)
    let link = this._links[model.link]
    if (link) {
      return this._store.get(model.name, { link })
    }
  }
}
