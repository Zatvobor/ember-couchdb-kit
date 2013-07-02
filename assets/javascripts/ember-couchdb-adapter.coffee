window.DS.CouchDBSerializer = DS.JSONSerializer.extend
  typeAttribute: 'ember_type'
  addEmptyHasMany: false
  addEmptyBelongsTo: false

  materialize: (record, hash) ->
    this._super.apply(this, arguments)
    record.materializeAttribute("_rev", hash.rev || hash._rev)

  serialize: (record, options) ->
    json = this._super.apply(this, arguments)
    this.addRevision(json, record, options)
    this.addTypeAttribute(json, record)
    json

  extract: (loader, json, type) ->
    this.extractRecordRepresentation(loader, type, json)

  extractId: (type, hash) ->
    hash._id || hash.id

  stringForType: (type) ->
    type.toString()

  getRecordRevision: (record) ->
    record.get('_data.attributes._rev')

  addId: (json, key, id) ->
    json._id = id

  addRevision: (json, record, options) ->
    if options && options.includeId
      rev = this.getRecordRevision(record)
      json._rev = rev if rev

  addTypeAttribute: (json, record) ->
    typeAttribute = this.get('typeAttribute')
    json[typeAttribute] = this.stringForType(record.constructor)

  addHasMany: (data, record, key, relationship) ->
    value = record.get(key)
    if this.get('addEmptyHasMany') || !Ember.empty(value)
      data[key] = value.getEach('id')

  addBelongsTo: (hash, record, key, relationship) ->
    id = get(record, relationship.key + '.id')
    hash[key] = id if this.get('addEmptyBelongsTo') || !Ember.empty(id)