###
  This object is a simple json based serializer with advanced conviniences for
  managing CouchDB entities.

@namespace DS
@class CouchDBSerializer
@extends DS.JSONSerializer
###
DS.CouchDBSerializer = DS.JSONSerializer.extend

  typeAttribute: 'ember_type'
  addEmptyHasMany: false
  addEmptyBelongsTo: false

  materialize: (record, hash) ->
    @_super.apply(@, arguments)

    record.materializeAttribute("_rev", hash.rev || hash._rev)
    # convenience for getting raw document body
    record.materializeAttribute("raw", hash)

  serialize: (record, options) ->
    json = @_super.apply(@, arguments)

    @addRevision(json, record, options)
    @addTypeAttribute(json, record)
    json

  extractHasMany: (type, hash, key) ->
    if key == "attachments" || key == "_attachments"
      @extractAttachments(hash["_attachments"],  type.toString(), hash)
    else
      hash[key]

  extractBelongsTo: (type, hash, key) ->
    if key == "history"
      @extractId(type, hash) + "/history"
    else
      hash[key]

  extract: (loader, json, type) ->
    @extractRecordRepresentation(loader, type, json)

  extractAttachments: (attachments, type, hash) ->
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
      rev = @getRecordRevision(record)
      json._rev = rev if rev

  addTypeAttribute: (json, record) ->
    if @get('add_type_attribute')
      typeAttribute = @get('typeAttribute')
      json[typeAttribute] = @stringForType(record.constructor)

  addHasMany: (data, record, key, relationship) ->
    @_addHasMany(data, record, key, relationship)

  _addHasMany: (data, record, key, relationship) ->
    value = record.get(key)
    attr_key = record.get("#{relationship.key}_key") || "id"
    if @get('addEmptyHasMany') || !Ember.isEmpty(value)
      values = value.getEach(attr_key)
      if (values.every (value) -> !value) #find undefined in relations
        values = record.get('_data.attributes.raw')[key]
        data[key] = values if values
      else
        data[key] = values

  addBelongsTo: (hash, record, key, relationship) ->
    return if key == "history"
    id_key = record.get("#{relationship.key}_key") || "id"
    id = Ember.get(record, "#{relationship.key}.#{id_key}")
    hash[key] = id if @get('addEmptyBelongsTo') || !Ember.isEmpty(id)

###

  An `CouchDBAdapter` is a main adapter for connecting your models with CouchDB documents.

  Let's consider a simple model:

    ```
    EmberApp.CouchDBModel = DS.Model.extend
       type: DS.attr('string')
       title: DS.attr('title')

    EmberApp.Store.registerAdapter('EmberApp.CouchDBModel', DS.CouchDBAdapter.extend({db: 'my_couchdb'}))
    ```

  The following available operations:

    ```
      # GET /my_couchdb/:id
      EmberApp.CouchDBModel.find("id")

      # POST /my_couchdb
      EmberApp.CouchDBModel.create({type: "my_type", title: "title"})

      # PUT /my_couchdb/:id
      model = EmberApp.CouchDBModel.find("id")
      model.set('title', 'new_title')
      model.get('store').commit()

      # DELETE /my_couchdb/:id
      model.deleteRecord()
    ```

  In additional, the following relations also available for getting and pushing related models:

    ```
    EmberApp.Post = DS.Model.extend
       title: DS.attr('string')

       # {"owner": "person@example.com"}
       owner:  DS.belongsTo('EmberApp.User', { key: 'owner': true})
       owner_key: 'email'

       # {"people":["person1@example.com", "person2@example.com"]}
       people: DS.hasMany('EmberApp.User',   { key: 'people', embedded: true})
       people_key: 'email'
    ```

  You can use `find` method for quering design views too:

    ```
    EmberApp.Task.find({type: "view", designDoc: 'tasks', viewName: "by_assignee", options: 'include_docs=true&key="%@"'.fmt(@get('email'))})
    # => Ember.Enumerable<EmberApp.Task>
    ```

  ## Tip and tricks

  Getting a raw document object

    ```
    doc = EmberApp.CouchDBModel.find("id")
    raw_json = doc.get('_data.attributes.raw')
    # => Object {_id: "...", _rev: "...", …}

  If you wonder about `id` which could be missed in your db then, you should check its `isLoaded` state

    ```
    doc = EmberApp.CouchDBModel.find("undefined")
    # GET http://127.0.0:5984/db/undefined 404 (Object Not Found)
    doc.get('isLoaded')
    # => false
    ```


@namespace DS
@class CouchDBAdapter
@extends DS.Adapter
###
DS.CouchDBAdapter = DS.Adapter.extend

  typeAttribute: 'ember_type'
  typeViewName: 'by-ember-type'
  customTypeLookup: false
  serializer: DS.CouchDBSerializer


  ajax: (url, type, hash) ->
    @_ajax('/%@/%@'.fmt(@get('db'), url || ''), type, hash)

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
    @_super.apply(arguments)

  stringForType: (type) ->
    @get('serializer').stringForType(type)

  find: (store, type, id) ->
    if @_checkForRevision(id)
      @findWithRev(store, type, id)
    else
      @ajax(id, 'GET', {
        context: this

        success: (data) ->
          this.didFindRecord(store, type, data, id)
      })

  findWithRev: (store, type, id) ->
    [_id, _rev] = id.split("/")[0..1]

    @ajax("%@?rev=%@".fmt(_id, _rev), 'GET', {
      context: this

      success: (data) ->
        @didFindRecord(store, type, data, id)
    })

  findManyWithRev:(store, type, ids) ->
    ids.forEach (id) =>
      @findWithRev(store, type, id)

  findMany: (store, type, ids) ->
    if @_checkForRevision(ids[0])
      @findManyWithRev(store, type, ids)
    else
      data =
        include_docs: true
        keys: ids

      @ajax('_all_docs?include_docs=true', 'POST', {
        data: data
        context: this

        success: (data) ->
          store.loadMany(type, data.rows.getEach('doc'))
      })

  findQuery: (store, type, query, modelArray) ->
    if query.type == 'view'
      designDoc = (query.designDoc || @get('designDoc'))

      @ajax('_design/%@/_view/%@'.fmt(designDoc, query.viewName), 'GET', {
        context: this
        data: query.options

        success: (data) ->
          recordDef = {}
          recordDef[designDoc] = data.rows.getEach('doc')
          this.didFindQuery(store, type, recordDef, modelArray)
      })

  findAll: (store, type) ->
    designDoc = @get('designDoc')

    if @get('customTypeLookup') && @viewForType
      params = {}
      viewName = @viewForType(type, params)
      params.include_docs = true

      @ajax('_design/%@/_view/%@'.fmt(designDoc, viewName), 'GET', {
        data: params
        context: this
        success: (data) ->
          store.loadMany(type, data.rows.getEach('doc'))
      })
    else
      typeViewName = @get('typeViewName')
      typeString = @stringForType(type)
      data =
        include_docs: true
        key: encodeURI('"' + typeString + '"')

      @ajax('_design/%@/_view/%@'.fmt(designDoc, typeViewName), 'GET', {
        context: this
        data: data
        success: (data) ->
          store.loadMany(type, data.rows.getEach('doc'))
      })

  createRecord: (store, type, record) ->
    json = @serialize(record)

    @ajax('', 'POST', {
      data: json
      context: this
      success: (data) ->
        store.didSaveRecord(record, $.extend(json, data))
    })

  updateRecord: (store, type, record) ->
    json = @serialize(record, {associations: false, includeId: true })

    @_updateAttachmnets(record, json)

    @ajax(record.get('id'), 'PUT', {
      data: json,
      context: this,
      success: (data) ->
        store.didSaveRecord(record, $.extend(json, data))
      error: (xhr, textStatus, errorThrown) ->
        if xhr.status == 409
          store.recordWasInvalid(record, {})
    })

  deleteRecord: (store, type, record) ->
    @ajax("%@?rev=%@".fmt(record.get('id'), record.get('_data.attributes._rev')), 'DELETE', {
      context: this
      success: (data) ->
        store.didSaveRecord(record)
    })

  _updateAttachmnets: (record, json) ->
    if window.AttachmentStore && record.get('attachments')
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

  _checkForRevision: (id) ->
    id.split("/").length > 1
