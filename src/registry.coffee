class EmberCouchDBKit.BaseRegistry
  constructor: ->
    @registiry = {}

  add: (key, value) ->
    @registiry[key] = value

  get: (key) ->
    @registiry[key]

  remove: ->
    delete @registiry[key]

class EmberCouchDBKit.RevsStoreClass extends EmberCouchDBKit.BaseRegistry
  mapRevIds: (key)->
    @get(key)._revs_info.map (_rev) =>  "%@/%@".fmt(@get(key)._id, _rev.rev)

EmberCouchDBKit.RevsStore = new EmberCouchDBKit.RevsStoreClass()

#store attachments
class EmberCouchDBKit.AttachmentStoreClass extends EmberCouchDBKit.BaseRegistry

EmberCouchDBKit.AttachmentStore = new EmberCouchDBKit.AttachmentStoreClass()

#works with changes you nedd registred longpoll worker
class EmberCouchDBKit.ChangesWorkersClass extends EmberCouchDBKit.BaseRegistry
  stopAll: ->
    for k,v of @registiry
      v.stop()

EmberCouchDBKit.ChangesWorkers =  new EmberCouchDBKit.ChangesWorkersClass()
