###
@namespace EmberCouchDBKit
@class DocumentSerializer
@extends DS.RESTSerializer
###
EmberCouchDBKit.DocumentSerializer = DS.RESTSerializer.extend

  primaryKey: '_id'

  normalize: (type, hash, prop) ->
    @normalizeId(hash)
    @normalizeAttachments(hash["_attachments"],  type.modelName, hash)
    @addHistoryId(hash)
    @normalizeUsingDeclaredMapping(type, hash)
    @normalizeAttributes(type, hash)
    @normalizeRelationships(type, hash)

    return @normalizeHash[prop](hash)  if @normalizeHash and @normalizeHash[prop]
    return hash if !hash

    @applyTransforms(type, hash)

    hash

  extractSingle: (store, type, payload, id, requestType) ->
    @_super(store, type, payload, id, requestType)

  extractMeta: (store, type, payload) ->
    if payload && payload.total_rows
      store.setMetadataFor(type, {total_rows: payload.total_rows})
      delete payload.total_rows
    return

  serialize: (snapshot, options) ->
    @_super(snapshot, options)

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

      EmberCouchDBKit.sharedStore.add('attachment', key, attachment)
      _attachments.push(key)
    hash.attachments = _attachments

  normalizeId: (hash) ->
    hash.id = (hash["_id"] || hash["id"])

  normalizeRelationships: (type, hash) ->
    payloadKey = undefined
    key = undefined
    if @keyForRelationship
      type.eachRelationship ((key, relationship) ->
        payloadKey = @keyForRelationship(key, relationship.kind)
        return  if key is payloadKey
        hash[key] = hash[payloadKey]
        delete hash[payloadKey]
      ), this

  serializeBelongsTo: (snapshot, json, relationship) ->
    attribute = (relationship.options.attribute || "id")
    key = relationship.key
    belongsTo = snapshot.belongsTo(key)
    return  if Ember.isNone(belongsTo)
    json[key] = if (attribute == "id") then belongsTo.id else belongsTo.attr(attribute)
    json[key + "_type"] = belongsTo.modelName  if relationship.options.polymorphic

  serializeHasMany: (snapshot, json, relationship) ->
    attribute = (relationship.options.attribute || "id")
    key = relationship.key
    relationshipType = snapshot.type.determineRelationshipType(relationship)
    switch relationshipType
      when "manyToNone", "manyToMany", "manyToOne"
          json[key] = snapshot.hasMany(key).mapBy(attribute)
###

  A `DocumentAdapter` should be used as a main adapter for working with models as a CouchDB documents.

  Let's consider:

    ```coffee
    EmberApp.DocumentAdapter = EmberCouchDBKit.DocumentAdapter.extend({db: db, host: host})
    EmberApp.DocumentSerializer = EmberCouchDBKit.DocumentSerializer.extend()

    EmberApp.Document = DS.Model.extend
      title: DS.attr('title')
      type: DS.attr('string', {defaultValue: 'document'})
    ```

  The following available operations:

    ```coffee
      # GET /my_couchdb/:id
      @get('store').find('document', id)

      # POST /my_couchdb
      @get('store').createRecord('document', {title: "title"}).save()

      # update PUT /my_couchdb/:id
      @get('store').find('document', id).then((document) ->
        document.set('title', title)
        document.save()
      )

      # DELETE /my_couchdb/:id
      @get('store').find('document', id).deleteRecord().save()
    ```

  For more advanced tips and tricks, you should check available specs

@namespace EmberCouchDBKit
@class DocumentAdapter
@extends DS.Adapter
###
EmberCouchDBKit.DocumentAdapter = DS.Adapter.extend
  defaultSerializer: '_default'
  customTypeLookup: false
  typeViewName: "all"

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

  ajax: (url, type, normalizeResponse, hash) ->
    @_ajax('%@/%@'.fmt(@buildURL(), url || ''), type, normalizeResponse, hash)

  _ajax: (url, type, normalizeResponse, hash={}) ->
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
          Ember.keys(headers).forEach (key) ->
            xhr.setRequestHeader key, headers[key]

      unless hash.success
        hash.success = (json) ->
          _modelJson = normalizeResponse.call(adapter, json)
          Ember.run(null, resolve, _modelJson)

      hash.error = (jqXHR, textStatus, errorThrown) ->
        if (jqXHR)
          jqXHR.then = null
        Ember.run(null, reject, jqXHR)

      Ember.$.ajax(hash)
    )

  _normalizeRevision: (json) ->
    if json && json._rev
      json.rev = json._rev
      delete json._rev
    json


  shouldCommit: (snapshot, relationships) ->
    @_super.apply(arguments)

  find: (store, type, id) ->
    if @_checkForRevision(id)
      @findWithRev(store, type, id)
    else
      normalizeResponse = (data) ->
        @_normalizeRevision(data)
        _modelJson = {}
        _modelJson[type.modelName] = data
        _modelJson

      @ajax(id, 'GET', normalizeResponse)

  findWithRev: (store, type, id, hash) ->
    [_id, _rev] = id.split("/")[0..1]
    url = "%@?rev=%@".fmt(_id, _rev)
    normalizeResponse = (data) ->
      @_normalizeRevision(data)
      _modelJson = {}
      data._id = id
      _modelJson[type.modelName] = data
      _modelJson
    @ajax(url, 'GET', normalizeResponse, hash)

  findManyWithRev: (store, type, ids) ->
    key = Ember.String.pluralize(type.modelName)
    self = @
    docs = {}
    docs[key] = []
    hash = {async: false}
    ids.forEach (id) =>
      [_id, _rev] = id.split("/")[0..1]
      url = "%@?rev=%@".fmt(_id, _rev)
      url = '%@/%@'.fmt(@buildURL(), url)
      hash.url = url
      hash.type = 'GET'
      hash.dataType = 'json'
      hash.contentType = 'application/json; charset=utf-8'
      hash.success = (json) ->
        json._id = id
        self._normalizeRevision(json)
        docs[key].push(json)
      Ember.$.ajax(hash)
    docs

  findMany: (store, type, ids) ->
    if @_checkForRevision(ids[0])
      @findManyWithRev(store, type, ids)
    else
      data =
        include_docs: true
        keys: ids

      normalizeResponse = (data) ->
        json = {}
        json[Ember.String.pluralize(type.modelName)] = data.rows.getEach('doc').map((doc) => @_normalizeRevision(doc))
        json

      @ajax('_all_docs?include_docs=true', 'POST', normalizeResponse, {
        data: data
      })

  findQuery: (store, type, query, modelArray) ->
    designDoc = (query.designDoc || @get('designDoc'))
    query.options = {} unless query.options
    query.options.include_docs = true

    normalizeResponse = (data) ->
      json = {}
      json[designDoc] = data.rows.getEach('doc').map((doc) => @_normalizeRevision(doc))
      json['total_rows'] = data.total_rows
      json

    @ajax('_design/%@/_view/%@'.fmt(designDoc, query.viewName), 'GET', normalizeResponse, {
      context: this
      data: query.options
    })

  findAll: (store, type) ->

    typeString = Ember.String.singularize(type.modelName)
    designDoc = @get('designDoc') || typeString

    typeViewName = @get('typeViewName')

    normalizeResponse = (data) ->
      json = {}
      json[[Ember.String.pluralize(type.modelName)]] = data.rows.getEach('doc').map((doc) => @_normalizeRevision(doc))
      json

    data =
      include_docs: true
      key: '"' + typeString + '"'

    @ajax('_design/%@/_view/%@'.fmt(designDoc, typeViewName), 'GET', normalizeResponse, {
      data: data
    })

  createRecord: (store, type, snapshot) ->
    json = store.serializerFor(type.modelName).serialize(snapshot)
    delete json.rev
    @_push(store, type, snapshot, json)

  updateRecord: (store, type, snapshot) ->
    json = @serialize(snapshot, {associations: true, includeId: true })
    snapData = snapshot.record._data
    @_updateAttachmnets(snapshot, json) if snapData.attachments.length > 0 if 'attachments' of snapData  
    delete json.rev
    @_push(store, type, snapshot, json)

  deleteRecord: (store, type, snapshot) ->
    @ajax("%@?rev=%@".fmt(snapshot.id, snapshot.attr('rev')), 'DELETE', (->), {
    })

  _updateAttachmnets: (snapshot, json) ->
    _attachments = {}

    snapshot._hasManyRelationships.attachments.forEach (item) ->
      attachment = EmberCouchDBKit.sharedStore.get('attachment', item.get('id'))
      _attachments[attachment.file_name] =
        content_type: attachment.content_type
        digest: attachment.digest
        length: attachment.length
        stub:   attachment.stub
        revpos: attachment.revpos

    json._attachments = _attachments
    delete json.attachments
    delete json.history

  _checkForRevision: (id) ->
    id.split("/").length > 1

  _push: (store, type, snapshot, json) ->
    id     = snapshot.id || ''
    method = if snapshot.id then 'PUT' else 'POST'

    if snapshot.attr('rev')
      json._rev = snapshot.attr('rev')
 
    normalizeResponse = (data) ->
      _data = json || {}
      @_normalizeRevision(data)
      _modelJson = {}
      _modelJson[type.modelName] = $.extend(_data, data)
      _modelJson

    @ajax(id, method, normalizeResponse, {
      data: json
    })
