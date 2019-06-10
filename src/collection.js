Array.prototype.load = async function (relOrObj, model, options) {
  model = this._store._model(model)
  let link = this._links[model.link]
  if (link) {
    link.model = model

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

Array.prototype.loadCollection = async function (relOrObj, model, options) {
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

  return {}
}

Array.prototype.post = async function (record, options) {
  if (!this._model) {
    return {}
  }
  const link = this._links[this._model.linkRels['post']]
  if (link) {
    link.model = this._model
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

Array.prototype.getById = function (id, model) {
  model = this._store._model(model)
  return this.find(i => i[model.primaryKey] === id)
}

Array.prototype.getByLink = function (relOrObj, model) {
  let link = relOrObj
  if (typeof link === 'string') {
    link = this._links[link]
  }
  if (link) {
    model = this._store._model(model)
    const idx = this._store._getIndexOf(this, model, link)
    if (idx !== -1) {
      return this[idx]
    }
  }
}

export default class Collection extends Array {
  constructor (...items) {
    super(...items)
    this._store = {}
    this._links = []
    this.response = {}
    this._model = {}
  }
}
