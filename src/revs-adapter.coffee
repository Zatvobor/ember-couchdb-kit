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

      if relationship.kind == "belongsTo"
        hash[key] = EmberCouchDBKit.RevsStore.mapRevIds(@extractId(type, hash))[1]
      else
        throw "Unsupported relation. Not yet implemented"

    ), this

###
  `RevAdapter` is an adapter which gets revisions info by distinct document and used
  as a main adapter for history enabled models.

  Let's consider `belongsTo` relation which returns previous version of document:
    ```coffee
    App.Task = DS.Model.extend
      title: DS.attr('string')
      history: DS.belongsTo('history')


    App.History = DS.Model.extend
      task: DS.belongsTo('task', {inverse: null})

    task = @get('store').find('task', id).get('history').then (history) ->
      history.get('task')
    ```

  For getting more details check `spec/coffeescripts/revs-adapter_spec.coffee` file.

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
