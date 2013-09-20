###
@namespace EmberCouchDBKit 
@class RevSerializer
@extends DS.RESTSerializer
###
EmberCouchDBKit.RevSerializer = DS.RESTSerializer.extend

  primaryKey: 'id'

  normalize: (type, hash, prop) ->
    @normalizeRelationships(type, hash)
    @_super(type, hash, prop)

  extractId: (type, hash) ->
    hash._id || hash.id

  normalizeRelationships: (type, hash) ->
    type.eachRelationship ((key, relationship) ->
      if relationship.kind =="belongsTo"
        hash[key] = EmberCouchDBKit.RevsStore.mapRevIds(@extractId(type, hash))[1]
    ), this

###
  An `RevAdapter` is an object which gets revisions info by distinct document and used
  as a main adapter for `Revision` models. Works only with belongsTo

  Let's consider an usual use case:
  TODO update example snippets
    ```
    App.Task = DS.Model.extend
      title: DS.attr('string')
      history: DS.belongsTo('App.History')


    App.History = DS.Model.extend
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
    @ajax("%@?revs_info=true".fmt(id.split("/")[0]), 'GET', {context: this}, id)

  updateRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  deleteRecord: (store, type, record) ->
    # just for stubbing purpose which should be defined by default

  ajax: (url, type, hash, id) ->
    @_ajax('%@/%@'.fmt(@buildURL(), url || ''), type, hash, id)

  _ajax: (url, type, hash, id) ->

    hash.url = url
    hash.type = type
    hash.dataType = 'json'
    hash.contentType = 'application/json; charset=utf-8'
    hash.context = this

    hash.data = JSON.stringify(hash.data) if (hash.data && type != 'GET')

    return new Ember.RSVP.Promise((resolve, reject) ->
      hash.success = (data) ->
        EmberCouchDBKit.RevsStore.add(id, data)
        Ember.run(null, resolve, {history: {id: id} })

      Ember.$.ajax(hash)
    )


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
