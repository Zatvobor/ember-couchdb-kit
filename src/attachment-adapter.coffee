###
  This object is a simple json based serializer with advanced conviniences for
  extracting all document's attachment metadata and prepare them for further extracting.

@namespace EmberCouchDBKit
@class AttachmentSerializer
@extends DS.JSONSerializer
###
EmberCouchDBKit.AttachmentSerializer = DS.JSONSerializer.extend

  materialize: (record, hash) ->
    @_super.apply(@, arguments)

    rev = (hash._rev || hash.rev)
    document_class = eval("#{hash.doc_type}")
    document = document_class.find(hash.doc_id)

    unless document.get('_data._rev') == rev
      if @getIntRevision(document.get('_data._rev')) < @getIntRevision(rev)
        document.set('_data._rev', rev)

    record.materializeAttribute("document", document)

  serialize: (record, options) ->
    @_super.apply(@, arguments)


  getIntRevision: (revision) ->
    parseInt(revision.split("-")[0])

  extract: (loader, json, type) ->
    @extractRecordRepresentation(loader, type, json)

  extractId: (type, hash) ->
    hash._id || hash.id

  getRecordRevision: (record) ->
    record.get('_data.rev')

  addId: (json, key, id) ->
    json._id = id

  addRevision: (json, record, options) ->
    if options && options.includeId
      rev = @getRecordRevision(record)
      json._rev = rev if rev

###
  An `AttachmentAdapter` is an object which manages document's attachements and used
  as a main adapter for `Attachment` models.

  Let's consider an usual use case:

    ```
    App.Task = DS.Model.extend
      title: DS.attr('string')
      attachments: DS.hasMany('App.Attachment', {embedded: true})

    App.Store.registerAdapter('App.Task', EmberCouchDBKit.DocumentAdapter.extend({db: 'docs'}))

    App.Attachment = DS.Model.extend
      content_type: DS.attr('string')
      length: DS.attr('number')
      file_name: DS.attr('string')
      db: DS.attr('string')

    App.Store.registerAdapter('App.Attachment', EmberCouchDBKit.AttachmentAdapter.extend({db: 'docs'}))
    ```

  So, the `App.Task` model is able to load its attachments as many `App.Attachment` models.

    ```
    task = App.Task.find("3bbf4b8c504134dd125e7b603b004b71")
    attachemnts = task.attachments # as an Ember.Enumerable instance
    ```

  In short, there is a simple example how to commit `App.Attachment` record

    ```
    params = {
      doc_id: doc_id
      doc_type: doc_type

      id: attachment_id
      blob_data: blob_data
      rev: doc_rev
      content_type: file_type
      length: file_size
      file_name: name
    }

    attachment = TaskEmber.Attachment.createRecord(params)
    attachment.get('store').commit()
    ```

@namespace EmberCouchDBKit
@class AttachmentAdapter
@extends DS.Adapter
###
EmberCouchDBKit.AttachmentAdapter = DS.Adapter.extend

  serializer: EmberCouchDBKit.AttachmentSerializer

  shouldCommit: (record, relationships) ->
    @_super.apply(arguments)

  find: (store, type, id) ->
    data = EmberCouchDBKit.AttachmentStore.get(id)
    @didFindRecord(store, type, data, id)

  findMany: (store, type, ids) ->
    docs = ids.map (item) =>
      item = EmberCouchDBKit.AttachmentStore.get(item)
      item.db = @get('db')
      item
    store.loadMany(type, docs)

  createRecord: (store, type, record) ->
    request = new XMLHttpRequest()
    path = "/%@/%@?rev=%@".fmt(@get('db'), record.get('id'), record.get('rev'))
    request.open('PUT', path, true)
    request.setRequestHeader('Content-Type', record.get('content_type'))

    @_updateUploadState(record, request)

    request.onreadystatechange =  =>
      if request.readyState == 4 && (request.status == 201 || request.status == 200)
        data = JSON.parse(request.response)
        data.doc_type = record.get('doc_type')
        data.doc_id = record.get('doc_id')
        json = @serialize(record, includeId: true)
        store.didSaveRecord(record, $.extend(json, data))

    request.send(record.get('file'))

  updateRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  deleteRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default


  _updateUploadState: (record, request) ->
    view = record.get('view')
    if view
      view.start_upload()
      request.onprogress = (oEvent) =>
        if oEvent.lengthComputable
          percentComplete = (oEvent.loaded / oEvent.total) * 100
          view.update_upload(percentComplete)
