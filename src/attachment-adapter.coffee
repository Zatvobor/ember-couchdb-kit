###
@namespace EmberCouchDBKit
@class AttachmentSerializer
@extends DS.RESTSerializer
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
  as a main adapter for `Attachment` enabled models.

  Let's consider an usual use case:
    ```coffee
    App.Task = DS.Model.extend
      title: DS.attr('string')
      attachments: DS.hasMany('attachment', {async: true})

    App.Attachment = DS.Model.extend
      content_type: DS.attr('string')
      length: DS.attr('number')
      file_name: DS.attr('string')
      db: DS.attr('string')

    task = @get('store').find('task', id)
    attachments = task.get('attachments')
    ```

    For getting more details check `spec/coffeescripts/attachment-adapter_spec.coffee` file.

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
