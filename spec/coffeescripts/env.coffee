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
      window.Fixture = Ember.Application.create({rootElement: "body"})

      @adapter()
      @store()
      @models()

    @

  adapter: ->
    Fixture.Adapter = EmberCouchDBKit.DocumentAdapter.extend({
      db: 'doc'
    })

  store: ->
    Fixture.Store = DS.Store.extend({
      adapter: Fixture.Adapter.create()
    })

  models: ->

    Fixture.Person = DS.Model.extend
      name: DS.attr('string')
      history: DS.belongsTo('Fixture.History')

    Fixture.Comment = DS.Model.extend
      text: DS.attr('string')

    Fixture.Article = DS.Model.extend
      label: DS.attr('string')
      person: DS.belongsTo(Fixture.Person),
      comments: DS.hasMany(Fixture.Comment)

    Fixture.History = DS.Model.extend()

    Fixture.Store.registerAdapter('Fixture.History', EmberCouchDBKit.RevsAdapter.extend({db: 'doc'}))


  create: (model, params) ->
    model = model.createRecord(params)

    runs ->
      model.save()

    waitsFor ->
      model.id != null
    , "Article id should have NOT be null", 3000

    model
