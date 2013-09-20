class @DatabaseCleaner
  @reset: ->
    @destroy()
    @create()

  @create: ->
    @_ajax('PUT')

  @destroy: ->
    @_ajax('DELETE')

  @_ajax: (type) ->
    jQuery.ajax({
      url:  "/doc",
      type: type,
      dataType:    'json',
      contentType: "application/json"
      cache:       true,
      async: false
    })


class @TestEnv

  constructor: ->
    DatabaseCleaner.reset()

    unless window.Fixture

      @models()

      mapping = {user: User, article: Article, comment: Comment, message: Message, history: History}
      window.Fixture = window.setupStore(mapping)

    @


  models: ->
    window.User = DS.Model.extend
      name: DS.attr('string')
      history: DS.belongsTo('history')

    window.Comment = DS.Model.extend
      text: DS.attr('string')

    window.Article = DS.Model.extend
      label: DS.attr('string')
      user: DS.belongsTo('user', {inverse: null}),
      comments: DS.hasMany('comment', {async: true, inverse: null})

    window.Message = DS.Model.extend
      user: DS.belongsTo('user', {attribute: "name"})

    window.History = DS.Model.extend()


  create: (type, params) ->
    model = window.Fixture.store.createRecord(type, params)

    runs ->
      model.save()

    waitsFor ->
      model.get('_data.rev') != undefined
    , "model should be saved", 3000

    model

  createDocument: (params, deleteID=true) ->
    id = (params.id || params._id)
    delete params.id if deleteID

    jQuery.ajax({
      url:  "/doc/#{id}",
      type: 'PUT',
      dataType:    'json',
      contentType: "application/json"
      data: JSON.stringify(params)
      cache:       true,
      async: false
    })

  find: (type, id) ->
    model = window.Fixture.store.find(type, id)
    waitsFor ->
      model.get('_data.rev') != undefined
    , "model should be fined", 3000
    model

  createView: (viewName) ->
    switch viewName
      when "byComment"
        doc =
          _id: "_design/comments"
          language: "javascript"
          views: {
            all: {map: "function(doc) { if (doc.type == \"comment\")  emit(null, {_id: doc._id}) }"}
          }
        @createDocument(doc, false)

  findQuery: (type, params) ->
    models = window.Fixture.store.find(type, params)
    waitsFor ->
      models.toArray().length != undefined && models.toArray().length != 0
    , "model should be fined", 3000
    models

window.setupStore = (options) ->
  env = {}

  options = options or {}
  container = env.container = new Ember.Container()
  adapter = env.adapter = EmberCouchDBKit.DocumentAdapter.extend({db:'doc'})

  delete options.adapter

  for prop of options
    container.register "model:" + prop, options[prop]

  container.register "store:main", DS.Store.extend(adapter: adapter)

  container.register "serializer:_default", EmberCouchDBKit.DocumentSerializer
  container.register "serializer:history", EmberCouchDBKit.RevSerializer

  container.register "adapter:_rest", DS.RESTAdapter
  container.register "adapter:history", EmberCouchDBKit.RevAdapter.extend({db:'doc'})

  container.register 'transform:boolean', DS.BooleanTransform
  container.register 'transform:date', DS.DateTransform
  container.register 'transform:number', DS.NumberTransform
  container.register 'transform:string', DS.StringTransform

  container.injection "serializer", "store", "store:main"

  env.serializer = container.lookup("serializer:_default")
  env.restSerializer = container.lookup("serializer:_rest")
  env.store = container.lookup("store:main")
  env.adapter = env.store.get("defaultAdapter")

  env
