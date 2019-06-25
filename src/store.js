import parseLinks from './link-header-parser'
import Collection from './collection'
import Record from './record'

export default class Store {
  constructor () {
    this._models = {}
    this.state = {}
    this.actions = {}
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
    this.defaultURLParams = {}
    this._errorHandler = {}
    this.entryPoint = null

    if (typeof window !== 'undefined' && window.Vue) {
      this.install(window.Vue)
    }
  }

  install (Vue, options) {
    Vue.prototype.$store = this
    if (options && options.entryPoint) {
      this.entryPoint = options.entryPoint
    }

    // eslint-disable-next-line no-new
    new Vue({
      data: this.state
    })
  }

  register (model) {
    model._store = this
    if (!model._parent) {
      this.state[model.name] = []
    }
    this._models[model.name] = model
  }

  addAction (name, func) {
    this.actions[name] = func
  }

  setGlobalErrorHandler (object) {
    this._errorHandler = object
  }

  call (name, options) {
    return this.actions[name](options)
  }

  _model (name) {
    return this._models[name]
  }

  parseHeaders (model, headers) {
    return new Headers(Object.assign({}, this.defaultHeaders, {
      'Accept': model.mediaType,
      'Content-Type': model.mediaType
    }, headers))
  }

  * findRelation (model, foreignKey, primaryKey, object, parents, parent) {
    /*
     Sucht ob die Id des übergebenen Objektes in anderen Objekten als Foreignkey existiert
     und gibt die Relation dann zurück.
     */
    parents = parents.slice(0)
    if (parents.length === 0) {
      yield* parent[model._parentKey || model.name].filter(item => item[foreignKey] === object[primaryKey])
    } else {
      let nextModel = parents.shift()

      for (let item of parent[nextModel._parentKey || nextModel.name]) {
        yield* this.findRelation(model, foreignKey, primaryKey, object, parents, item)
      }
    }
  }

  async getEntry (headers) {
    let entry = this.state['entryPoint']

    if (!entry) {
      const response = await fetch(
        this.entryPoint,
        {
          headers: new Headers(Object.assign({}, this.defaultHeaders, headers))
        }
      )
      let record = new Record(this, response)
      if (response.ok) {
        record._links = Object.assign(record._links, parseLinks(response.headers.get('link')))
        this.state['entryPoint'] = record
      }

      return record
    } else {
      return entry
    }
  }

  _getIndexOf (collection, model, link) {
    return collection.findIndex((item) => {
      const self = item[model.selfAttr] || item._links.self
      return self.href === link.href && (link.type.includes(self.type) || self.type.includes(link.type))
    })
  }

  _setCollection (collection, model, link) {
    const idx = this._getIndexOf(this.state[model.name], model, link)

    if (idx === -1) {
      this.state[model.name].push(collection)
    } else {
      this.state[model.name].splice(
        idx,
        1,
        collection
      )
    }
  }

  _setRecord (record, model, link) {
    for (const [i, item] of this.state[model.name].entries()) {
      if (Array.isArray(item)) {
        const idx = this._getIndexOf(item, model, link)
        if (idx !== -1) {
          item.splice(
            idx,
            1,
            record
          )
          return
        }
      } else {
        const self = record[model.selfAttr]
        if (self.href === link.href && (link.type.includes(self.type) || self.type.includes(link.type))) {
          this.state[model.name].splice(
            i,
            1,
            record
          )
          return
        }
      }
    }
    this.state[model.name].push(record)
  }

  _get (collection, model, link) {
    for (const [i, item] of this.state[model.name].entries()) {
      const self = item[model.selfAttr] || item._links.self
      if (self.href === link.href && (link.type.includes(self.type) || self.type.includes(link.type))) {
        return item
      }
    }
  }

  _getRecord (collection, model, link) {
    for (const [i, item] of this.state[model.name].entries()) {
      if (Array.isArray(item)) {
        const idx = this._getIndexOf(item, model, link)
        if (idx !== -1) {
          return item[idx]
        }
      } else {
        const self = item[model.selfAttr]
        if (self.href === link.href && (link.type.includes(self.type) || self.type.includes(link.type))) {
          return this.state[model.name][i]
        }
      }
    }
  }

  _getRecordById (collection, model, id) {
    for (const [i, item] of this.state[model.name].entries()) {
      if (Array.isArray(item)) {
        return item.find(rec => rec[model.primaryKey] === id)
      } else {
        if (item[model.primaryKey] === id) {
          return item
        }
      }
    }
  }

  _parseUrl (url, params) {
    if (params) {
      let query = url + '?'

      for (let pair of Object.entries(params)) {
        if (!!pair[1] && !pair[1].includes('{')) {
          query += `${pair[0]}=${pair[1]}&`
        }
      }

      return query.substring(0, query.length - 1)
    }
    return url
  }

  _findCollection (model, link) {
    for (const item of this.state[model.name]) {
      if (Array.isArray(item)) {
        const idx = this._getIndexOf(item, model, link)
        if (idx !== -1) {
          return item
        }
      }
    }
    return this.state[model.name]
  }

  async findAll (nameOrObj, params = {}, options = {}) {
    let url
    let model
    if (typeof nameOrObj === 'object') {
      model = nameOrObj.model
      url = this._parseUrl(nameOrObj.href, Object.assign(
        {},
        nameOrObj.params,
        this.defaultURLParams,
        options.params
      ))
      if (!options.reload) {
        const idx = this._getIndexOf(this.state[model.name], model, nameOrObj)
        if (idx !== -1) {
          return this.state[model.name][idx]
        }
      }
    } else {
      model = this._model(nameOrObj)
      url = model.listUrl(params, Object.assign({}, this.defaultURLParams, options.params))
    }
    const response = await fetch(
      url,
      {
        headers: this.parseHeaders(model, options.headers)
      }
    )

    if (response.ok) {
      let json = await response.json()
      json = json.map(item => {
        let record = new Record(this, response, model.name)
        item = model.deserialize(item)

        return Object.assign(record, item)
      })
      /* for (let i = 0; i < json.length; i++) {
        const object = json[i]
        this.setRelations(object, model, parent)
      } */
      const collection = Collection.from(json)
      collection._links = parseLinks(response.headers.get('link'))
      if (!options['no-store']) {
        this._setCollection(collection, model, collection[model.selfAttr] || collection._links.self)
      }
      collection.response = response
      collection._store = this
      collection._model = model
      return collection
    } else if (this._errorHandler[response.status]) {
      this._errorHandler[response.status](response, this, model)
    }
    throw response
  }

  async find (nameOrObj, id, params = {}, options = {}) {
    let url
    let model
    if (typeof nameOrObj === 'object') {
      model = nameOrObj.model
      url = this._parseUrl(nameOrObj.href, Object.assign(
        {},
        nameOrObj.params,
        this.defaultURLParams,
        options.params
      ))
      if (!options.reload) {
        const item = this._getRecord(this.state[model.name], model, nameOrObj)
        if (item && item.isLoaded) {
          return item
        }
      }
    } else {
      model = this._model(nameOrObj)
      url = model.itemUrl(id, params, Object.assign({}, this.defaultURLParams, options.params))
    }
    const response = await fetch(
      url,
      {
        headers: this.parseHeaders(model, options.headers)
      }
    )

    if (response.ok) {
      let json = await response.json()
      json = model.deserialize(json)
      /*
            this.setRelations(json, model, parent)
      */
      let record = new Record(this, response, model.name)
      record = Object.assign(record, json)
      record._links = Object.assign(record._links, parseLinks(response.headers.get('link')))
      record.isLoaded = true
      if (!options['no-store']) {
        this._setRecord(record, model, record[model.selfAttr] || record._links.self)
      }
    } else if (this._errorHandler[response.status]) {
      this._errorHandler[response.status](response, this, model)
    }
    throw response
  }

  async create (nameOrObj, data = {}, params = {}, options = {}) {
    let url
    let model
    if (typeof nameOrObj === 'object') {
      model = nameOrObj.model
      url = this._parseUrl(nameOrObj.href, Object.assign(
        {},
        nameOrObj.params,
        this.defaultURLParams,
        options.params
      ))
    } else {
      model = this._model(nameOrObj)
      url = model.listUrl(params, options.params)
    }
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(model.serialize(data)),
      headers: this.parseHeaders(model, options.headers)
    })
    let record = new Record(this, response, model.name)
    if (response.ok) {
      let json = await response.json()
      json = model.deserialize(json)
      /*
            this.setRelations(json, model, parent)
      */
      record = Object.assign(record, json)
      record._links = Object.assign(record._links, parseLinks(response.headers.get('link')))
      this._setRecord(record, model, record[model.selfAttr] || record._links.self)

      return record
    } else if (this._errorHandler[response.status]) {
      this._errorHandler[response.status](response, this, model)
    }
    throw response
  }

  new (name, data = {}) {
    const model = this._model(name)
    const record = new Record(this, null, model.name)
    data = model.deserialize(data)

    return Object.assign(record, data)
  }

  async update (nameOrObj, data = {}, params = {}, options = {}) {
    let url
    let model
    if (typeof nameOrObj === 'object') {
      model = nameOrObj.model
      url = this._parseUrl(nameOrObj.href, Object.assign(
        {},
        nameOrObj.params,
        this.defaultURLParams,
        options.params
      ))
    } else {
      model = this._model(nameOrObj)
      url = model.itemUrl(data[model.primaryKey], params, options.params)
    }
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(model.serialize(data)),
      headers: this.parseHeaders(model, options.headers)
    })

    let record = new Record(this, response, model.name)
    if (response.ok) {
      let json = await response.json()
      json = model.deserialize(json)
      /*
            this.setRelations(json, model, parent)
      */
      record = Object.assign(record, json)
      record._links = Object.assign(record._links, parseLinks(response.headers.get('link')))
      this._setRecord(record, model, record[model.selfAttr] || record._links.self)

      return record
    } else if (this._errorHandler[response.status]) {
      this._errorHandler[response.status](response, this, model)
    }
    throw response
  }

  async delete (nameOrObj, record, params = {}, options = {}) {
    let url
    let model
    let collection
    if (typeof nameOrObj === 'object') {
      model = nameOrObj.model
      url = this._parseUrl(nameOrObj.href, Object.assign(
        {},
        nameOrObj.params,
        this.defaultURLParams,
        options.params
      ))
      collection = this._findCollection(model, nameOrObj)
    } else {
      model = this._model(nameOrObj)
      url = model.itemUrl(record[model.primaryKey], params, options.params)
    }
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.parseHeaders(model, options.headers)
    })
    if (response.ok) {
      if (collection) {
        const idx = this._getIndexOf(collection, model, nameOrObj)
        collection.splice(idx, 1)
      } else {
        const item = this._getRecord(this.state[model.name], model, nameOrObj)
        // @Todo: Item muss noch aus Liste gelöscht werden
        /* if (idx >= 0) {
          this.setRelations(parent[model._parentKey || model.name][idx], model, parent, false, true)
        } */
        /* this.state[model._parentKey || model.name].splice(
          idx,
          1
        ) */
      }
      return response
    } else if (this._errorHandler[response.status]) {
      this._errorHandler[response.status](response, this, model)
    }
    throw response
  }

  /* get (name, id = null, params = {}) {
    try {
      const model = this._model(name)
      return id && this.state[model._parentKey || model.name] ? this.state[model._parentKey || model.name].find(item => item.id === id) || {}
        : this.state[model._parentKey || model.name] || []
    } catch (e) {
      throw new Error(`Cannot find model: ${name}. Please check the name or if the parent is loaded.`)
    }
  } */

  get (model, params = {}) {
    model = this._model(model)
    if (!this.state['entryPoint'] || !model) {
      return
    }
    if (params.link) {
      const item = this._getRecord(this.state[model.name], model, params.link) || this._get(this.state[model.name], model, params.link)
      if (item) {
        return item
      } else {
        return
      }
    }
    if (params.id) {
      const item = this._getRecordById(this.state[model.name], model, params.id)
      if (item) {
        return item
      } else {
        return
      }
    }
    const idx = this._getIndexOf(this.state[model.name], model, model.link)
    if (idx !== -1) {
      return this.state[model.name][idx]
    }
  }
}
