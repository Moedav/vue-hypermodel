import { HasMany, HasOne, HasLink, HasManyLink } from './relationships'

import Transformer, {
  DatetimeTransformer,
  DateTransformer,
  DecimalTransformer,
  FloatTransformer,
  IntegerTransformer,
  LinkObjTransformer,
  StringTransformer,
  UrlTransformer
} from './transformers'
import qs from 'querystring'

export default class Model {
  constructor () {
    this._store = null
    this._parent = undefined
    this.lastRequestUrl = undefined
  }

  get name () {
    return undefined
  }

  get selfAttr () {
    return 'self'
  }

  get mediaType () {
    return 'application/json'
  }

  get primaryKey () {
    return 'id'
  }

  get hasParent () {
    return !!this._parent
  }

  register (model) {
    // Check if relationship exists in current (parent) model
    const ownRelationship = Object.entries(this.relationships).find(
      item => item[1].modelName === model.name
    )
    if (!ownRelationship) {
      throw Error(`No relationship found for ${model.name} in ${this.name}`)
    }

    // Check if relationship exists in child model
    const childRelationship = Object.values(model.relationships).find(
      item => item.modelName === this.name
    )
    if (!childRelationship) {
      throw Error(`No relationship found for ${this.name} in ${model.name}`)
    }

    model._parent = this
    model._parentKey = ownRelationship[0]
    this._store.register(model)
  }

  url (params = {}) {
    return undefined
  }

  urlParams (params) {
    if (params) {
      let query = '?'

      for (let pair of Object.entries(params)) {
        query += `${pair[0]}=${pair[1]}&`
      }

      return query.substring(0, query.length - 1)
    }
    return ''
  }

  listUrl (params = {}, urlParams) {
    return this.url(params) + this.urlParams(urlParams)
  }

  itemUrl (id, params = {}, urlParams) {
    if (!id) {
      throw Error('`id` must be provided when calling `store.find()`')
    }
    return `${this.url(params)}/${id}${this.urlParams(urlParams)}`
  }

  deserialize (json) {
    const fields = this.fields
    const relationships = this.relationships
    const result = {}

    for (const key in fields) {
      if (!fields.hasOwnProperty(key)) {
        continue
      }

      const transformer = fields[key]
      result[key] = transformer.deserialize(json[key])
    }
    for (const relationKey in relationships) {
      if (!relationships.hasOwnProperty(relationKey)) {
        continue
      }

      let urlObj = null
      let qry = {}
      let obj = {}

      const meta = relationships[relationKey]
      switch (meta.type) {
        case 'hasOne':
          if (!json[relationKey]) {
            result[relationKey] = {}
          } else {
            result[relationKey] = json[relationKey]
          }
          break
        case 'hasMany':
          if (!json[relationKey]) {
            result[relationKey] = []
          } else {
            result[relationKey] = json[relationKey]
          }
          break
        case 'hasManyLink':
          urlObj = new URL(json[meta.attribute].href)
          qry = qs.parse(urlObj.search.substring(1))

          obj[json[meta.attribute].rel] = Object.assign(json[meta.attribute], {
            href: urlObj.origin + urlObj.pathname,
            link: json[meta.attribute].href,
            params: qry
          })
          if (result._links) {
            result._links = Object.assign(result._links, obj)
          } else {
            result._links = obj
          }
          if (!json[relationKey]) {
            result[relationKey] = []
          } else {
            result[relationKey] = json[relationKey]
          }
          break
        case 'hasLink':
          urlObj = new URL(json[meta.attribute].href)
          qry = qs.parse(urlObj.search.substring(1))

          obj[json[meta.attribute].rel] = Object.assign(json[meta.attribute], {
            href: urlObj.origin + urlObj.pathname,
            link: json[meta.attribute].href,
            params: qry
          })
          if (result._links) {
            result._links = Object.assign(result._links, obj)
          } else {
            result._links = obj
          }
          if (!json[relationKey]) {
            result[relationKey] = {}
          } else {
            result[relationKey] = json[relationKey]
          }
      }
    }
    return result
  }

  serialize (json) {
    const fields = this.fields
    const result = {}

    for (const key in fields) {
      if (!fields.hasOwnProperty(key)) {
        return
      }

      const transformer = fields[key]
      result[key] = transformer.serialize(json[key])
    }

    return result
  }

  fields () {
    return {}
  }

  linkRels () {
    return {}
  }

  computedProperties () {
    return {}
  }

  attr (defaultValue) {
    return new Transformer(defaultValue)
  }

  string (defaultValue) {
    return new StringTransformer(defaultValue)
  }

  integer (defaultValue) {
    return new IntegerTransformer(defaultValue)
  }

  float (defaultValue) {
    return new FloatTransformer(defaultValue)
  }

  number (defaultValue) {
    return new FloatTransformer(defaultValue)
  }

  decimal (defaultValue, decimalPlaces = 2) {
    return new DecimalTransformer(defaultValue, decimalPlaces)
  }

  boolean (defaultValue) {
    return new Transformer(defaultValue)
  }

  date (defaultValue) {
    return new DateTransformer(defaultValue)
  }

  datetime (defaultValue) {
    return new DatetimeTransformer(defaultValue)
  }

  link (defaultValue) {
    return new UrlTransformer(defaultValue)
  }

  uuid (defaultValue) {
    return new StringTransformer(defaultValue)
  }

  linkObj (defaultValue) {
    return new LinkObjTransformer(defaultValue)
  }

  relationships () {

  }

  hasOne (modelName, foreignKey) {
    return new HasOne(modelName, foreignKey)
  }

  hasMany (modelName) {
    return new HasMany(modelName)
  }

  hasLink (attribute, modelName) {
    return new HasLink(attribute, modelName)
  }

  hasManyLink (attribute, modelName) {
    return new HasManyLink(attribute, modelName)
  }
}
