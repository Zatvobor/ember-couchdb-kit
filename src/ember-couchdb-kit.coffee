#= require_self
#
#= require registry
#= require document-adapter
#= require attachment-adapter
#= require revs-adapter
#= require changes-feed


window.EmberCouchDBKit = Ember.Namespace.create({
  VERSION: '1.0.dev'
})

EmberCouchDBKit.sharedStore = do ->
  _data = {}
  
  add: (type, key, value) ->
    _data[type + ':' + key] = value
  get: (type, key) ->
    _data[type + ':' + key]
  remove: (type, key) ->
  	delete _data[type + ':' + key]
  mapRevIds: (type, key)->
    @get(type, key)._revs_info.map (_rev) =>  "%@/%@".fmt(@get(type, key)._id, _rev.rev)
  stopAll: ->
    for k,v of _data
      v.stop() if k.indexOf('changes_worker') is 0
