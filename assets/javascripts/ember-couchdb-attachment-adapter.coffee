class @AttachmentStore
  @attachments = {}
  @add: (key, value) ->
    @attachments[key] = value

  @get: (key) ->
    @attachments[key]

  @remove: ->
    @attachments[key] = undefined


DS.CouchDBAttachmentSerializer = DS.JSONSerializer.extend

  materialize: (record, hash) ->
    this._super.apply(this, arguments)
    rev = (hash._rev || hash.rev)
    document_class = eval("#{hash.doc_type}")
    document = document_class.find(hash.doc_id)

    unless document.get('_data.attributes._rev') == rev
      if @get_int_revision(document.get('_data.attributes._rev')) < @get_int_revision(rev)
        document.set('_data.attributes._rev', rev)

    record.materializeAttribute("document", document)


  serialize: (record, options) ->
    this._super.apply(this, arguments)


  get_int_revision: (revision) ->
    parseInt(revision.split("-")[0])

  extract: (loader, json, type) ->
    this.extractRecordRepresentation(loader, type, json)

  extractId: (type, hash) ->
    hash._id || hash.id

  getRecordRevision: (record) ->
    record.get('_data.attributes.rev')

  addId: (json, key, id) ->
    json._id = id

  addRevision: (json, record, options) ->
    if options && options.includeId
      rev = this.getRecordRevision(record)
      json._rev = rev if rev


DS.CouchDBAttachmentAdapter = DS.Adapter.extend
  serializer: DS.CouchDBAttachmentSerializer

  shouldCommit: (record, relationships) ->
    this._super.apply(arguments)

  find: (store, type, id) ->
    data = AttachmentStore.get(id)
    this.didFindRecord(store, type, data, id)

  findMany: (store, type, ids) ->
    docs = ids.map (item) =>
      item = AttachmentStore.get(item)
      item.db = this.get('db')
      item
    store.loadMany(type, docs)

  createRecord: (store, type, record) ->
    request = new XMLHttpRequest()
    request.open('PUT', "/#{this.get('db')}/"+record.get('id') + '?rev=' + record.get('rev'), true)
    request.setRequestHeader('Content-Type', record.get('content_type'))
    request.send(record.get('blob_data'))
    request.onreadystatechange =  =>
      if request.readyState == 4 && (request.status == 201 || request.status == 200)
        data = JSON.parse(request.response)
        data.doc_type = record.get('doc_type')
        data.doc_id = record.get('doc_id')
        json = @serialize(record, includeId: true)
        store.didSaveRecord(record, $.extend(json, data))

  updateRecord: (store, type, record) ->
    console.log "updateRecord"
#    json = this.serialize(record, {associations: true, includeId: true })
#    this.ajax(record.get('id'), 'PUT', {
#      data: json,
#      context: this,
#      success: (data) ->
#        store.didSaveRecord(record, $.extend(json, data))
#      error: (xhr, textStatus, errorThrown) ->
#        if xhr.status == 409
#          store.recordWasInvalid(record, {})
#    })

  deleteRecord: (store, type, record) ->
    console.log "deleteRecord"
#    this.ajax(record.get('id') + '?rev=' + record.get('_data.attributes._rev'), 'DELETE', {
#      context: this
#      success: (data) ->
#        store.didSaveRecord(record)
#    })