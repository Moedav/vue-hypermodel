export default class Collection extends Array {
  constructor (store, response, ...items) {
    super(...items)
    this._store = store
    this._links = []
    this.response = response
  }

  get mediaType () {
    return 'application/json'
  }

  async load (relOrObj, model, options) {
    let link = relOrObj
    if (typeof link === 'string') {
      link = this._links[link]
    }
    if (link) {
      link.name = model

      const record = await this._store.find(link, null, Object.assign({
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

  async post (record, options) {
    if (!this._model) {
      return {}
    }
    const link = this._links[this._model.linkRels['post']]
    if (link) {
      link.name = this._model.name
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

  async get (relOrObj, model) {
    let link = relOrObj
    if (typeof link === 'string') {
      link = this._links[link]
    }
    if (link) {
      link.name = model
      model = this._store._model(model)
      const idx = this._store._getIndexOf(this, model, link)
      if (idx !== -1) {
        return this[idx]
      }
    }
  }
}
