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

    App.Comment = DS.Model.extend
      text: DS.attr('string')

    App.Article = DS.Model.extend
      label: DS.attr('string')
      person: DS.belongsTo(App.Person),
      comments: DS.hasMany(App.Comment)

  createPerson: (params) ->
    TestEmberApp.createAbstract(App.Person.createRecord(params))

  createArticle: (params) ->
    TestEmberApp.createAbstract(App.Article.createRecord(params))

  createComment: (params) ->
    TestEmberApp.createAbstract(App.Comment.createRecord(params))


  @createAbstract: (model) ->

    runs ->
      model.save()

    waitsFor ->
      model.id != null
    , "Article id should have NOT be null", 3000

    model