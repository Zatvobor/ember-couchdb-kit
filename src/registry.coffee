class EmberCouchDBKit.BaseRegistry
  @registiry = {}

  @add: (key, value) ->
    @registiry[key] = value

  @get: (key) ->
    @registiry[key]

  @remove: ->
    delete @registiry[key]

class EmberCouchDBKit.RevsStore extends EmberCouchDBKit.BaseRegistry
  @mapRevIds: (key)->
    @get(key)._revs_info.map (_rev) =>  "%@/%@".fmt(@get(key)._id, _rev.rev)

#store attachments
class EmberCouchDBKit.AttachmentStore extends EmberCouchDBKit.BaseRegistry


#works with changes you nedd registred longpoll worker
class EmberCouchDBKit.ChangesWorkers extends EmberCouchDBKit.BaseRegistry
  @stopAll: ->
    for k,v of @registiry
      v.stop()