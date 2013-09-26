###
@namespace EmberCouchDBKit
@class DocumentSerializer
@extends DS.RESTSerializer
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
    return hash if !hash

    @applyTransforms(type, hash)

    hash

  extractSingle: (store, type, payload, id, requestType) ->
    @_super(store, type, payload, id, requestType)

  serialize: (record, options) ->
    @_super(record, options)

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
    switch relationshipType
      when "manyToNone", "manyToMany", "manyToOne"
        if Ember.get(record, key).get('isLoaded')
          json[key] = Ember.get(record, key).mapBy(attribute)
        else
          if record.get("_data.%@".fmt(key))
            json[key] = record.get("_data.%@".fmt(key)).mapBy('id')
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
    if json && json._rev
      json.rev = json._rev
      delete json._rev
    json


  shouldCommit: (record, relationships) ->
    @_super.apply(arguments)

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
    url = "%@?rev=%@".fmt(_id, _rev)
    normalizeResponce = (data) ->
      @_normalizeRevision(data)
      _modelJson = {}
      data._id = id
      _modelJson[type.typeKey] = data
      _modelJson
    @ajax(url, 'GET', normalizeResponce)

  findMany: (store, type, ids) ->
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
    designDoc = (query.designDoc || @get('designDoc'))
    query.options = {} unless query.options
    query.options.include_docs = true

    normalizeResponce = (data) ->
      json = {}
      json[designDoc] = data.rows.getEach('doc').map((doc) => @_normalizeRevision(doc))
      json

    @ajax('_design/%@/_view/%@'.fmt(designDoc, query.viewName), 'GET', normalizeResponce, {
      context: this
      data: query.options
    })

  findAll: (store, type) ->

    typeString = Ember.String.singularize(type.typeKey)

    designDoc = @get('designDoc') || typeString

    typeViewName = @get('typeViewName')

    normalizeResponce = (data) ->
      json = {}
      json[[Ember.String.pluralize(type.typeKey)]] = data.rows.getEach('doc').map((doc) => @_normalizeRevision(doc))
      json

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
    delete json.history

  _checkForRevision: (id) ->
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
