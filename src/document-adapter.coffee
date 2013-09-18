###
  This object is a simple json based serializer with advanced conviniences for
  managing CouchDB entities.

@namespace EmberCouchDBKit 
@class DocumentSerializer
@extends DS.RESTSerializer.extend
###
EmberCouchDBKit.DocumentSerializer = DS.RESTSerializer.extend

  primaryKey: '_id'

  normalize: (type, hash, prop) ->
    @normalizeId(hash)
    @normalizeAttachments(hash["_attachments"],  type.typeKey, hash)
    @addHistoryId(hash)
    @normalizeUsingDeclaredMapping(type, hash)
    @normalizeAttributes(type, hash)
    @normalizeRelationships(type, hash)
    return @normalizeHash[prop](hash)  if @normalizeHash and @normalizeHash[prop]
    if (!hash)
      return hash

    this.applyTransforms(type, hash);
    hash;

  extractSingle: (store, type, payload, id, requestType) ->
    @_super(store, type, payload, id, requestType)

  serialize: (record, options) ->
    json = this._super(record, options)
    json

  addHistoryId: (hash) ->
    hash.history = "%@/history".fmt(hash.id)

  normalizeAttachments: (attachments, type, hash) ->
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
        rev: hash.rev
        file_name: k
        model_name: type
        revpos: v.revpos
        db: v.db

      EmberCouchDBKit.AttachmentStore.add(key, attachment)
      _attachments.push(key)
    hash.attachments = _attachments

  normalizeId: (hash) ->
    hash.id = (hash["_id"] || hash["id"])

  serializeBelongsTo: (record, json, relationship) ->
    attribute = (relationship.options.attribute || "id")
    key = relationship.key
    belongsTo = Ember.get(record, key)
    return  if Ember.isNone(belongsTo)
    json[key] = Ember.get(belongsTo, attribute)
    json[key + "_type"] = belongsTo.constructor.typeKey  if relationship.options.polymorphic

  serializeHasMany: (record, json, relationship) ->
    attribute = (relationship.options.attribute || "id")
    key = relationship.key
    relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship)
    json[key] = Ember.get(record, key).mapBy(attribute)  if relationshipType is "manyToNone" or relationshipType is "manyToMany"

###

  TODO Remove old

  An `DocumentAdapter` is a main adapter for connecting your models with CouchDB documents.

  Let's consider a simple model:

    ```
    EmberApp.CouchDBModel = DS.Model.extend
       title: DS.attr('title')

    EmberApp.Store.registerAdapter('EmberApp.CouchDBModel', EmberCouchDBKit.DocumentAdapter.extend({db: 'my_couchdb'}))
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
       type: DS.attr('string', defaultValue: 'post')
       title: DS.attr('string')

       # {"owner": "person@example.com"}
       owner:  DS.belongsTo('EmberApp.User', {key: 'owner', embeded: true, attribute: "email"})

       # {"people":["person1@example.com", "person2@example.com"]}
       people: DS.hasMany('EmberApp.User', {key: 'people', embedded: true, attribute: "email"})
    ```

  You can use `find` method for quering design views:

    ```
    tasks = EmberApp.Task.find({type: "view", designDoc: 'tasks', viewName: "by_assignee", options: 'include_docs=true&key="%@"'.fmt(@get('email'))})
    array = tasks.get('content')
    # => Array[EmberApp.Task,..]
    ```

  ## Tip and tricks

  Getting a raw document object

    ```
    doc = EmberApp.CouchDBModel.find('myId')
    raw_json = doc.get('_data.raw')
    # => Object {_id: "...", _rev: "...", …}

  Creating a named document

    ```
    myDoc = EmberApp.CouchDBModel.createRecord({id: 'myId'})
    # …
    myDoc = EmberApp.CouchDBModel.find('myId')
    # => Object {id: "myId", …}

  If you wonder about `id` which could be missed in your db then, you should check its `isLoaded` state

    ```
    myDoc = EmberApp.CouchDBModel.createRecord({id: 'myId'})
    # …
    myDoc = EmberApp.CouchDBModel.find('myId')
    # => Object {id: "myId", …}

  If you wonder about some document which could be missed in your db, then you could use a simple `is` convenience

    ```
    doc = EmberApp.CouchDBModel.find(myId)
    doc.get('store.adapter').is(200, {for: doc})
    # => true
    doc.get('store.adapter').is(404, {for: doc})
    # => undefined
    ```

  You're able to fetch a `HEAD` for your document

    ```
    doc = EmberApp.CouchDBModel.find(myId)
    doc.get('store.adapter').head(doc).getAllResponseHeaders()
    # => "Date: Sat, 31 Aug 2013 13:48:30 GMT
    #    Cache-Control: must-revalidate
    #    Server: CouchDB/1.3.1 (Erlang OTP/R15B03)
    #    Connection: keep-alive
    #    ..."
    ```


@namespace EmberCouchDBKit
@class DocumentAdapter
@extends DS.Adapter
###
EmberCouchDBKit.DocumentAdapter = DS.Adapter.extend

  customTypeLookup: false

  is: (status, h) ->
    return true if @head(h.for).status == status

  head: (h) ->
    docId = if typeof h == "object" then h.get('id') else h
    @ajax(docId, 'HEAD', { async: false })

  buildURL: ->
    host = Ember.get(this, "host")
    namespace = Ember.get(this, "namespace")
    url = []
    url.push host  if host
    url.push namespace  if namespace
    url.push @get('db')
    url = url.join("/")
    url = "/" + url  unless host
    url

  ajax: (url, type, normalizeResponce, hash) ->
    @_ajax('%@/%@'.fmt(@buildURL(), url || ''), type, normalizeResponce, hash)

  _ajax: (url, type, normalizeResponce, hash={}) ->
    adapter = this
    return new Ember.RSVP.Promise((resolve, reject) ->
      if url.split("/").pop() == "" then url = url.substr(0, url.length - 1)
      hash.url = url
      hash.type = type
      hash.dataType = 'json'
      hash.contentType = 'application/json; charset=utf-8'

      hash.context = adapter

      if hash.data && type != 'GET'
        hash.data = JSON.stringify(hash.data)

      if adapter.headers
        headers = adapter.headers
        hash.beforeSend = (xhr) ->
          forEach.call Ember.keys(headers), (key) ->
            xhr.setRequestHeader key, headers[key]

      unless hash.success
        hash.success = (json) ->
          _modelJson = normalizeResponce.call(adapter, json)
          Ember.run(null, resolve, _modelJson)

      hash.error = (jqXHR, textStatus, errorThrown) ->
        if (jqXHR)
          jqXHR.then = null
        Ember.run(null, reject, jqXHR)

      Ember.$.ajax(hash)
    )

  _normalizeRevision: (json) ->
    if json._rev
      json.rev = json._rev
      delete json._rev
    json


  shouldCommit: (record, relationships) ->
    @_super.apply(arguments)

  stringForType: (type) ->
    @get('serializer').stringForType(type)

  find: (store, type, id) ->
    if @_checkForRevision(id)
      @findWithRev(store, type, id)
    else
      normalizeResponce = (data) ->
        @_normalizeRevision(data)
        _modelJson = {}
        _modelJson[type.typeKey] = data
        _modelJson

    @ajax(id, 'GET', normalizeResponce)

  findWithRev: (store, type, id) ->
    [_id, _rev] = id.split("/")[0..1]
    normalizeResponce = (data) ->
      @_normalizeRevision(data)
      _modelJson = {}
      _modelJson[type.typeKey] = data
      _modelJson
    @ajax("%@?rev=%@".fmt(_id, _rev), 'GET', normalizeResponce)

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

      normalizeResponce = (data) ->
        json = {}
        json[Ember.String.pluralize(type.typeKey)] = data.rows.getEach('doc').map((doc) => @_normalizeRevision(doc))
        json

      @ajax('_all_docs?include_docs=true', 'POST', normalizeResponce, {
        data: data
      })

  findQuery: (store, type, query, modelArray) ->
    if query.type == 'view'
      designDoc = (query.designDoc || @get('designDoc'))

      normalizeResponce = (data) ->
        json = {}
        json[designDoc] = data.rows.getEach('doc').map((doc) => @_normalizeRevision(doc))
        json

      @ajax('_design/%@/_view/%@'.fmt(designDoc, query.viewName), 'GET', normalizeResponce, {
        context: this
        data: query.options
      })

  findAll: (store, type) ->
    designDoc = @get('designDoc')

    normalizeResponce = (data) ->
      json = {}
      json[[Ember.String.pluralize(type.typeKey)]] = data.rows.getEach('doc').map((doc) => @_normalizeRevision(doc))
      json

    if @get('customTypeLookup') && @viewForType
      params = {}
      viewName = @viewForType(type, params)
      params.include_docs = true

      @ajax('_design/%@/_view/%@'.fmt(designDoc, viewName), 'GET', normalizeResponce, {
        data: params
      })
    else
      typeViewName = @get('typeViewName')
      typeString = @stringForType(type)
      data =
        include_docs: true
        key: '"' + typeString + '"'

      @ajax('_design/%@/_view/%@'.fmt(designDoc, typeViewName), 'GET', normalizeResponce, {
        data: data
      })

  createRecord: (store, type, record) ->
    json = store.serializerFor(type.typeKey).serialize(record);
    @_push(store, type, record, json)

  updateRecord: (store, type, record) ->
    json = @serialize(record, {associations: true, includeId: true })
    @_updateAttachmnets(record, json) if record.get('attachments')
    @_push(store, type, record, json)

  deleteRecord: (store, type, record) ->
    @ajax("%@?rev=%@".fmt(record.get('id'), record.get('_data.rev')), 'DELETE', (->), {
    })

  _updateAttachmnets: (record, json) ->
    _attachments = {}

    record.get('attachments').forEach (item) ->
      attachment = EmberCouchDBKit.AttachmentStore.get(item.get('id'))
      _attachments[item.get('file_name')] =
        content_type: attachment.content_type
        digest: attachment.digest
        length: attachment.length
        stub:   attachment.stub
        revpos: attachment.revpos

    json._attachments = _attachments
    delete json.attachments

  _checkForRevision: (id) ->
    id?.split("/").length > 1
    id.split("/").length > 1

  _push: (store, type, record, json) ->
    id     = record.get('id') || ''
    method = if record.get('id') then 'PUT' else 'POST'

    if record.get('_data.rev')
      json._rev = record.get('_data.rev')

    normalizeResponce = (data) ->
      _data = json || {}
      @_normalizeRevision(data)
      _modelJson = {}
      _modelJson[type.typeKey] = $.extend(_data, data)
      _modelJson

    @ajax(id, method, normalizeResponce, {
      data: json
    })
