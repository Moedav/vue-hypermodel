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

  async load (relOrObj, model) {
    let link = relOrObj
    if (typeof link === 'string') {
      link = this._links[link]
    }
    if (link) {
      link.name = model

      const record = await this._store.find(link, null, {
        headers: {
          Accept: link.type ? link.type : 'application/json'
        }
      })

      return record
    }
    return {}
  }

  async loadCollection (relOrObj, model) {
    let link = relOrObj
    if (typeof link === 'string') {
      link = this._links[link]
    }
    if (link) {
      link.name = model

      const collection = await this._store.findAll(link, null, {
        headers: {
          Accept: link.type ? link.type : 'application/json'
        }
      })

      return collection
    }

    return {}
  }

  async create (record) {
    if (!this._model) {
      return {}
    }
    const create = this._links[this._model.linkRels['create']]
    if (create) {
      create.name = this._model.name
      record = await this._store.create(create, record, null, {
        headers: {
          Accept: create.type ? create.type : 'application/json',
          'Content-Type': create.type ? create.type : 'application/json'
        }
      })

      return record
    }
    return {}
  }
}
