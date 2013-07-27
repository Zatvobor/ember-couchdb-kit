###
  This object is a simple json based serializer with advanced `extractHasMany` convinience for
  extracting all document's revisions and prepare them for further loading.

@namespace EmberCouchDBKit 
@class RevsSerializer
@extends DS.JSONSerializer
###
EmberCouchDBKit.RevsSerializer = DS.JSONSerializer.extend

  materialize: (record, hash) ->
    @_super.apply(@, arguments)

  serialize: (record, options) ->
    @_super.apply(@, arguments)

  extract: (loader, json, type) ->
    @extractRecordRepresentation(loader, type, json)

  extractId: (type, hash) ->
    hash._id || hash.id

  addId: (json, key, id) ->
    json._id = id

  extractHasMany: (type, hash, key) ->
    hash[key] = RevsStore.mapRevIds(@extractId(type, hash))

  extractBelongsTo: (type, hash, key) ->
    if key.match("prev_")
      hash[key] = RevsStore.mapRevIds(@extractId(type, hash))[1]


###
  An `RevsAdapter` is an object which gets revisions info by distinct document and used
  as a main adapter for `Revision` models.

  Let's consider an usual use case:

    ```
    App.Task = DS.Model.extend
      title: DS.attr('string')
      history: DS.belongsTo('App.History')

    App.Store.registerAdapter('App.Task', EmberCouchDBKit.DocumentAdapter.extend({db: 'docs'}))

    App.History = DS.Model.extend
      tasks: DS.hasMany('App.Task', {key: "tasks", embedded: true})
      prev_task: DS.belongsTo('App.Task', {key: "prev_task", embedded: true})


    App.Store.registerAdapter('App.History', EmberCouchDBKit.RevsAdapter.extend({db: 'docs'}))
    ```

  So, the `App.Task` model is able to load its revisions as a regular `App.Task` models.

    ```
    task = App.Task.find("3bbf4b8c504134dd125e7b603b004b71")

    revs_tasks = task.history.tasks
    # => Ember.Enumerable<App.Task>
    ```

@namespace EmberCouchDBKit
@class RevsAdapter
@extends DS.Adapter
###
EmberCouchDBKit.RevsAdapter = DS.Adapter.extend
  serializer: EmberCouchDBKit.RevsSerializer

  shouldCommit: (record, relationships) ->
    @_super.apply(arguments)

  find: (store, type, id) ->
    @ajax("%@?revs_info=true".fmt(id.split("/")[0]), 'GET', {
      context: this

      success: (data) ->
        RevsStore.add(id, data)
        this.didFindRecord(store, type, {_id: id}, id)
    })

  updateRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  deleteRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  ajax: (url, type, hash) ->
    @_ajax('/%@/%@'.fmt(@get('db'), url || ''), type, hash)


  _ajax: (url, type, hash) ->
    if url.split("/").pop() == "" then url = url.substr(0, url.length - 1)

    hash.url = url
    hash.type = type
    hash.dataType = 'json'
    hash.contentType = 'application/json; charset=utf-8'
    hash.context = this

    hash.data = JSON.stringify(hash.data) if (hash.data && type != 'GET')

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
