class @TestEmberApp

  constructor: ->
    unless window.App
      window.App = Ember.Application.create({rootElement: "body"})
      @adapter()
      @store()
      @models()

  adapter: ->
    App.adapter = EmberCouchDBKit.DocumentAdapter.create({
      db: 'doc'
    })

  store: ->
    App.store = DS.Store.create({
      adapter: App.Adapter
    })

  models: ->

    App.Person = DS.Model.extend
      name: DS.attr('string')

    App.Comment = DS.Model.extend
      text: DS.attr('string')

    App.Article = DS.Model.extend
      label: DS.attr('string')
      writer: DS.belongsTo(App.Person),
      comments: DS.hasMany(App.Comment)