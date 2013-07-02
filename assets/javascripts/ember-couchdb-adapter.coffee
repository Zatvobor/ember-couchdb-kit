DS.CouchDBSerializer = DS.JSONSerializer.extend
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
    if this.get('add_type_attribute')
      typeAttribute = this.get('typeAttribute')
      json[typeAttribute] = this.stringForType(record.constructor)

  addHasMany: (data, record, key, relationship) ->
    value = record.get(key)
    attr_key = record.get("users_key") || "id"
    if this.get('addEmptyHasMany') || !Ember.isEmpty(value)
      data[key] = value.getEach(attr_key)

  addBelongsTo: (hash, record, key, relationship) ->
    id = get(record, relationship.key + '.id')
    hash[key] = id if this.get('addEmptyBelongsTo') || !Ember.isEmpty(id)


DS.CouchDBAdapter = DS.Adapter.extend
  typeAttribute: 'ember_type'
  typeViewName: 'by-ember-type'
  customTypeLookup: false
  serializer: DS.CouchDBSerializer

  _ajax: (url, type, hash) ->
    hash.url = url
    hash.type = type
    hash.dataType = 'json'
    hash.contentType = 'application/json; charset=utf-8'
    hash.context = this

    if hash.data && type != 'GET'
      hash.data = JSON.stringify(hash.data)
    Ember.$.ajax(hash)

  shouldCommit: (record, relationships) ->
    this._super.apply(arguments)

  ajax: (url, type, hash) ->
    db = this.get('db')
    this._ajax('/%@/%@'.fmt(db, url || ''), type, hash)

  stringForType: (type) ->
    this.get('serializer').stringForType(type)

  find: (store, type, id) ->
    this.ajax(id, 'GET', {
      context: this
      success: (data) ->
        this.didFindRecord(store, type, data, id)
    })

  findMany: (store, type, ids) ->
    data =
      include_docs: true
      keys: ids

    this.ajax('_all_docs', 'POST', {
      data: data
      context: this
      success: (data) ->
        store.loadMany(type, data.rows.getEach('doc'))
    })

  findQuery: (store, type, query, modelArray) ->
    designDoc = this.get('designDoc')
    if query.type == 'view'
      this.ajax('_design/%@/_view/%@'.fmt(query.designDoc || designDoc, query.viewName), 'GET', {
        data: query.options
        success: (data) ->
          modelArray.load(data.rows.getEach('doc'))
        context: this
      })

  findAll: (store, type) ->
    designDoc = this.get('designDoc')
    if this.get('customTypeLookup') && this.viewForType
      params = {}
      viewName = this.viewForType(type, params)
      params.include_docs = true
      this.ajax('_design/%@/_view/%@'.fmt(designDoc, viewName), 'GET', {
        data: params
        context: this
        success: (data) ->
          store.loadMany(type, data.rows.getEach('doc'))
      })
    else
      typeViewName = this.get('typeViewName')
      typeString = this.stringForType(type)
      data =
        include_docs: true
        key: encodeURI('"' + typeString + '"')
      this.ajax('_design/%@/_view/%@'.fmt(designDoc, typeViewName), 'GET', {
        context: this
        data: data
        success: (data) ->
          store.loadMany(type, data.rows.getEach('doc'))
      })

  createRecord: (store, type, record) ->
    json = this.serialize(record)
    this.ajax('', 'POST', {
      data: json
      context: this
      success: (data) ->
        store.didSaveRecord(record, $.extend(json, data))
    })

  updateRecord: (store, type, record) ->
    json = this.serialize(record, {associations: true, includeId: true })
    this.ajax(record.get('id'), 'PUT', {
      data: json,
      context: this,
      success: (data) ->
        store.didSaveRecord(record, $.extend(json, data))
      error: (xhr, textStatus, errorThrown) ->
        if xhr.status == 409
          store.recordWasInvalid(record, {})
    })

  deleteRecord: (store, type, record) ->
    this.ajax(record.get('id') + '?rev=' + record.get('_data.attributes._rev'), 'DELETE', {
      context: this
      success: (data) ->
        store.didSaveRecord(record)
    })