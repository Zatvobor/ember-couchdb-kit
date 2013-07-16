###
  An `CouchDBRevsAdapter` is an object which gets revisions info by distict document and used
  as a main adapter for `Revision` models.

  Let's consider an usual use case:

    ```
    App.Task = DS.Model.extend
      title: DS.attr('string')
      history: DS.belongsTo('App.History')

    App.Store.registerAdapter('App.Task', DS.CouchDBAdapter.extend({db: 'docs'}))

    App.History = DS.Model.extend
      tasks: DS.hasMany('App.Task', {key: "tasks", embedded: true})
      prev_task: DS.belongsTo('App.Task', {key: "prev_task", embedded: true})


    App.Store.registerAdapter('App.History', DS.CouchDBRevsAdapter.extend({db: 'docs'}))
    ```

  So, the `App.Task` model is able to load its revisions as a regular `App.Task` models.

    ```
    task = App.Task.find("3bbf4b8c504134dd125e7b603b004b71")
    revs_tasks = task.history.tasks # as an Ember.Enumerable instance
    ```

@namespace DS
@class CouchDBRevsAdapter
@extends DS.Adapter
###
DS.CouchDBRevsSerializer = DS.JSONSerializer.extend

  materialize: (record, hash) ->
    this._super.apply(this, arguments)

  serialize: (record, options) ->
    this._super.apply(this, arguments)

  get_int_revision: (revision) ->
    parseInt(revision.split("-")[0])

  extract: (loader, json, type) ->
    this.extractRecordRepresentation(loader, type, json)

  extractId: (type, hash) ->
    hash._id || hash.id

  addId: (json, key, id) ->
    json._id = id

  extractHasMany: (type, hash, key) ->
    hash[key] = RevsStore.mapRevIds(@extractId(type, hash))

  extractBelongsTo: (type, hash, key) ->
    if key.match("prev_")
      hash[key] = RevsStore.mapRevIds(@extractId(type, hash))[1]

DS.CouchDBRevsAdapter = DS.Adapter.extend
  serializer: DS.CouchDBRevsSerializer

  shouldCommit: (record, relationships) ->
    this._super.apply(arguments)

  find: (store, type, id) ->
    _id = id.split("/")[0]
    this.ajax("#{_id}?revs_info=true", 'GET', {
      context: this
      success: (data) ->
        RevsStore.add(id, data)
        history_item = {}
        history_item._id = id
        this.didFindRecord(store, type, history_item, id)
    })

  updateRecord: ->
    #never delete this! блядь!

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

# @private
class @RevsStore
  @registiry = {}

  @add: (key, value) ->
    @registiry[key] = value

  @get: (key) ->
    @registiry[key]

  @remove: ->
    @registiry[key] = undefined

  @mapRevIds: (key)->
    @get(key)._revs_info.map (_rev) =>  "%@/%@".fmt(@get(key)._id, _rev.rev)