#= require ember-couchdb-attachment-adapter
#= require ember-couchdb-revs-adapter

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

  extractHasMany: (type, hash, key) ->
    if key == "attachments" || key == "_attachments"
      @extract_attachments(hash["_attachments"],  type.toString(), hash)
    else
      hash[key]

  extractBelongsTo: (type, hash, key) ->
    if key == "history"
      @extractId(type, hash) + "/history"
    else
      hash[key]

  extract: (loader, json, type) ->
    this.extractRecordRepresentation(loader, type, json)

  extract_attachments: (attachments, type, hash) ->
    _attachments = []
    for k, v of attachments
      key = "#{hash._id}/#{k}"
      attachment =
        id: key
        content_type: v.content_type
        digest: v.digest
        length: v.length
        stub: v.stub
        doc_id: hash._id
        _rev: hash._rev
        file_name: k
        doc_type: type
        revpos: v.revpos
        db: v.db

      AttachmentStore.add(key, attachment)
      _attachments.push(key)
    _attachments

  extractId: (type, hash) ->
    hash._id || hash.id

  stringForType: (type) ->
    type = type.toString()
    if type.search(".") < 0
      type
    else
      pattern = /((?:.*))\.(\w+)/ig
      reg_array = pattern.exec(type)
      reg_array[reg_array.length - 1].toString().toLowerCase()

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
    @_addHasMany(data, record, key, relationship)

  _addHasMany: (data, record, key, relationship) ->
    value = record.get(key)
    attr_key = record.get("#{relationship.key}_key") || "id"
    if this.get('addEmptyHasMany') || !Ember.isEmpty(value)
      data[key] = value.getEach(attr_key)

  addBelongsTo: (hash, record, key, relationship) ->
    id_key = record.get("#{relationship.key}_key") || "id"
    id = Ember.get(record, "#{relationship.key}.#{id_key}")
    hash[key] = id if this.get('addEmptyBelongsTo') || !Ember.isEmpty(id)

DS.CouchDBAdapter = DS.Adapter.extend
  typeAttribute: 'ember_type'
  typeViewName: 'by-ember-type'
  customTypeLookup: false
  serializer: DS.CouchDBSerializer


  ajax: (url, type, hash) ->
    db = this.get('db')
    this._ajax('/%@/%@'.fmt(db, url || ''), type, hash)

  _ajax: (url, type, hash) ->
    if url.split("/").pop() == "" then url = url.substr(0, url.length - 1)
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

  stringForType: (type) ->
    this.get('serializer').stringForType(type)

  find: (store, type, id) ->
    if @_check_for_revision(id)
      @find_with_rev(store, type, id)
    else
      this.ajax(id, 'GET', {
        context: this
        success: (data) ->
          this.didFindRecord(store, type, data, id)
      })

  find_with_rev: (store, type, id) ->
    [_id, _rev] = id.split("/")[0..1]
    this.ajax("#{_id}?rev=#{_rev}", 'GET', {
      context: this
      success: (data) ->
        this.didFindRecord(store, type, data, id)
    })

  find_many_with_rev:(store, type, ids) ->
    ids.forEach (id) =>
      @find_with_rev(store, type, id)

  findMany: (store, type, ids) ->
    if @_check_for_revision(ids[0])
      @find_many_with_rev(store, type, ids)
    else
      data =
        include_docs: true
        keys: ids

      this.ajax('_all_docs?include_docs=true', 'POST', {
        data: data
        context: this
        success: (data) ->
          store.loadMany(type, data.rows.getEach('doc'))
      })

  findQuery: (store, type, query, modelArray) ->
    if query.type == 'view'
      designDoc = (query.designDoc || this.get('designDoc'))
      this.ajax('_design/%@/_view/%@'.fmt(designDoc, query.viewName), 'GET', {

        context: this
        data: query.options

        success: (data) ->
          recordDef = {}
          recordDef[designDoc] = data.rows.getEach('doc')
          this.didFindQuery(store, type, recordDef, modelArray)
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
    delete json.history
    @_update_attachmnets(record, json)
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

  _update_attachmnets: (record, json) ->
    if window.AttachmentStore
      _attachments = {}
      record.get('attachments').forEach (item) ->
        attachment = AttachmentStore.get(item.get('id'))
        _attachments[item.get('file_name')] =
          content_type: attachment.content_type
          digest: attachment.digest
          length: attachment.length
          stub:   attachment.stub
          revpos: attachment.revpos
      json._attachments = _attachments
      delete json.attachments

  _check_for_revision: (id) ->
    id.split("/").length > 1