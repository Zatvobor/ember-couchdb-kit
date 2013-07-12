###
This object is a simple json based serializer with advanced `extractHasMany` convinience for
extracting all document's revisions and prepare them for further loading.

@namespace DS
@class CouchDBRevsSerializer
@extends DS.JSONSerializer
###
DS.CouchDBRevsSerializer = DS.JSONSerializer.extend

  materialize: (record, hash) ->
    @_super.apply(this, arguments)

  serialize: (record, options) ->
    @_super.apply(this, arguments)

  extract: (loader, json, type) ->
    this.extractRecordRepresentation(loader, type, json)

  extractId: (type, hash) ->
    hash._id || hash.id

  addId: (json, key, id) ->
    json._id = id

  extractHasMany: (type, hash, key) ->
    hash[key] = RevsStore.mapRevIds(@extractId(type, hash))


###
An `CouchDBRevsAdapter` is an object which gets revisions info by distict document and used
as a main adapter for `Revision` models.

@namespace DS
@class CouchDBRevsAdapter
@extends DS.Adapter
###
DS.CouchDBRevsAdapter = DS.Adapter.extend
  serializer: DS.CouchDBRevsSerializer

  shouldCommit: (record, relationships) ->
    this._super.apply(arguments)

  find: (store, type, id) ->
    this.ajax("#{id.split("/")[0]}?revs_info=true", 'GET', {
      context: this
      success: (data) ->
        RevsStore.add(id, data)
        this.didFindRecord(store, type, {_id: id}, id)
    })

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

###
@private

Document's revisions info registry
###
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