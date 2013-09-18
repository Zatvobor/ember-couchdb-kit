###
  This object is a simple json based serializer with advanced `extractHasMany` convinience for
  extracting all document's revisions and prepare them for further loading.

@namespace EmberCouchDBKit 
@class RevSerializer
@extends DS.RESTSerializer
###
EmberCouchDBKit.RevSerializer = DS.RESTSerializer.extend

  primaryKey: 'id'

  normalize: (type, hash, prop) ->
    @normalizeHistories(hash, type.typeKey, hash)
    @_super(type, hash, prop)

  extractId: (type, hash) ->
    hash._id || hash.id

  normalizeHistories: (hash, type) ->
    hash["histories"] = EmberCouchDBKit.RevsStore.mapRevIds(@extractId(type, hash))
    hash["prev_history"] = EmberCouchDBKit.RevsStore.mapRevIds(@extractId(type, hash))[1]

###
  An `RevAdapter` is an object which gets revisions info by distinct document and used
  as a main adapter for `Revision` models.

  Let's consider an usual use case:

    ```
    App.Task = DS.Model.extend
      title: DS.attr('string')
      history: DS.belongsTo('App.History')


    App.History = DS.Model.extend
      tasks: DS.hasMany('App.Task', {key: "tasks", embedded: true})
      prev_task: DS.belongsTo('App.Task', {key: "prev_task", embedded: true})


    ```

  So, the `App.Task` model is able to load its revisions as a regular `App.Task` models.

    ```
    task = App.Task.find("3bbf4b8c504134dd125e7b603b004b71")

    revs_tasks = task.history.tasks
    # => Ember.Enumerable<App.Task>
    ```

@namespace EmberCouchDBKit
@class RevAdapter
@extends DS.Adapter
###
EmberCouchDBKit.RevAdapter = DS.Adapter.extend

  find: (store, type, id) ->
    @ajax("%@?revs_info=true".fmt(id.split("/")[0]), 'GET', id, {
      context: this
    })

  updateRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  deleteRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  ajax: (url, type, hash, id) ->
    @_ajax('/%@/%@'.fmt(@get('db'), url || ''), type, hash, id)


  _ajax: (url, type, hash, id) ->

    if url.split("/").pop() == "" then url = url.substr(0, url.length - 1)

    hash.url = url
    hash.type = type
    hash.dataType = 'json'
    hash.contentType = 'application/json; charset=utf-8'
    hash.context = this

    hash.data = JSON.stringify(hash.data) if (hash.data && type != 'GET')

    return new Ember.RSVP.Promise((resolve, reject) ->
      hash.success = (data) ->
        EmberCouchDBKit.RevsStore.add(id, data)
        Ember.run(null, resolve, { rev: data })

      Ember.$.ajax(hash)
    )