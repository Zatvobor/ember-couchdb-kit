###
  This object is a simple json based serializer with advanced conviniences for
  extracting all document's attachment metadata and prepare them for further extracting.

@namespace EmberCouchDBKit
@class AttachmentSerializer
@extends DS.JSONSerializer
###
EmberCouchDBKit.AttachmentSerializer = DS.RESTSerializer.extend

  primaryKey: 'id'

  normalize: (type, hash) ->
    self = this
    rev = (hash._rev || hash.rev)
    @store.find(hash.model_name, hash.doc_id).then (document) ->
      unless document.get('_data.rev') == rev
        if self.getIntRevision(document.get('_data.rev')) < self.getIntRevision(rev)
          document.set('_data.rev', rev)
    @_super(type, hash)

  getIntRevision: (revision) ->
    parseInt(revision.split("-")[0])

  normalizeId: (hash) ->
    hash.id = (hash["_id"] || hash["id"])

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

  find: (store, type, id) ->
    return new Ember.RSVP.Promise((resolve, reject) ->
      Ember.run(null, resolve, {attachment: EmberCouchDBKit.AttachmentStore.get(id)})
    )

  findMany: (store, type, ids) ->
    docs = ids.map (item) =>
      item = EmberCouchDBKit.AttachmentStore.get(item)
      item.db = @get('db')
      item

    return new Ember.RSVP.Promise((resolve, reject) ->
      Ember.run(null, resolve, {attachments: docs})
    )

  createRecord: (store, type, record) ->
    url = "%@/%@?rev=%@".fmt(@buildURL(), record.get('id'), record.get('rev'))
    adapter = this

    return new Ember.RSVP.Promise((resolve, reject) ->
      data = {}
      data.context = adapter
      request = new XMLHttpRequest()
      request.open('PUT', url, true)
      request.setRequestHeader('Content-Type', record.get('content_type'))
      adapter._updateUploadState(record, request)

      request.onreadystatechange =  =>
        if request.readyState == 4 && (request.status == 201 || request.status == 200)
          data = JSON.parse(request.response)
          data.model_name = record.get('model_name')
          data.doc_id = record.get('doc_id')
          json = adapter.serialize(record, includeId: true)
          delete data.id
          Ember.run(null, resolve, {attachment: $.extend(json, data)})
      request.send(record.get('file'))
    )

  updateRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  deleteRecord: (store, type, record) ->
    return new Ember.RSVP.Promise((resolve, reject) ->
      Ember.run(null, resolve, {})
    )

  _updateUploadState: (record, request) ->
    view = record.get('view')
    if view
      view.startUpload()
      request.onprogress = (oEvent) =>
        if oEvent.lengthComputable
          percentComplete = (oEvent.loaded / oEvent.total) * 100
          view.updateUpload(percentComplete)

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