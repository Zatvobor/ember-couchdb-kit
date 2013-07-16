###
  An `CouchDBAttachmentAdapter` is an object which manages document's attachements and used
  as a main adapter for `Attachment` models.

  Let's consider an usual use case:

    ```
    App.Task = DS.Model.extend
      title: DS.attr('string')
      attachments: DS.hasMany('App.Attachment', {embedded: true})

    App.Store.registerAdapter('App.Task', DS.CouchDBAdapter.extend({db: 'docs'}))

    App.Attachment = DS.Model.extend
      content_type: DS.attr('string')
      length: DS.attr('number')
      file_name: DS.attr('string')
      db: DS.attr('string')

    App.Store.registerAdapter('App.Attachment', DS.CouchDBAttachmentAdapter.extend({db: 'docs'}))
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

@namespace DS
@class CouchDBAttachmentAdapter
@extends DS.Adapter
###
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
    request.setRequestHeader('Content-Type', record.get('content_type'))

    path = "/%@/%@?rev=%@".fmt(@get('db'), record.get('id'), record.get('rev'))
    request.open('PUT', path, true)
    request.send(record.get('blob_data'))

    request.onreadystatechange =  =>
      if request.readyState == 4 && (request.status == 201 || request.status == 200)
        data = JSON.parse(request.response)
        data.doc_type = record.get('doc_type')
        data.doc_id = record.get('doc_id')

        json = @serialize(record, includeId: true)
        delete data.id

        store.didSaveRecord(record, $.extend(json, data))

  updateRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  deleteRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

###
  This object is a simple json based serializer with advanced conviniences for
  extracting all document's attachment metadata and prepare them for further extracting.

@namespace DS
@class CouchDBAttachmentSerializer
@extends DS.JSONSerializer
###
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


# @private
class @AttachmentStore
  @attachments = {}
  @add: (key, value) ->
    @attachments[key] = value

  @get: (key) ->
    @attachments[key]

  @remove: ->
    @attachments[key] = undefined