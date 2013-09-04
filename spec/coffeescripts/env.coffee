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


class @TestEmberApp

  constructor: ->
    unless window.App
      window.App = Ember.Application.create({rootElement: "body"})
      @adapter()
      @store()
      @models()
    @

  adapter: ->
    App.Adapter = EmberCouchDBKit.DocumentAdapter.extend({
      db: 'doc'
    })

  store: ->
    App.Store = DS.Store.extend({
      adapter: App.Adapter.create()
    })

  models: ->

    App.Person = DS.Model.extend
      name: DS.attr('string')
      history: DS.belongsTo('App.History')

    App.Comment = DS.Model.extend
      text: DS.attr('string')

    App.Article = DS.Model.extend
      label: DS.attr('string')
      person: DS.belongsTo(App.Person),
      comments: DS.hasMany(App.Comment)

    App.History = DS.Model.extend()

    App.Store.registerAdapter('App.History', EmberCouchDBKit.RevsAdapter.extend({db: 'doc'}))

  createPerson: (params) ->
    TestEmberApp.createAbstract(App.Person.createRecord(params))

  createArticle: (params) ->
    TestEmberApp.createAbstract(App.Article.createRecord(params))

  createMessage: (params) ->
    TestEmberApp.createAbstract(App.Message.createRecord(params))

  createComment: (params) ->
    TestEmberApp.createAbstract(App.Comment.createRecord(params))

  @createAbstract: (model) ->

    runs ->
      model.save()

    waitsFor ->
      model.id != null
    , "Article id should have NOT be null", 3000

    model
