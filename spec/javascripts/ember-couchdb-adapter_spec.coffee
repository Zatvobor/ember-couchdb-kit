Ember.ENV.TESTING = true

window.expectType = (type) ->
  expect(type).toBe(window.ajaxType)

window.expectAjaxCall = (type, url, data) ->
  expectType(type)
  expectUrl(url)

window.expectUrl = (url) ->
  expect(url).toBe(window.ajaxUrl)

describe "DS.CouchDBSerializer", ->
  beforeEach ->
    @klass = new DS.CouchDBSerializer()
  it "has been defined", ->
    expect(DS.CouchDBSerializer).toBeDefined()

  it "returns typeAttribute", ->
    expect(@klass.typeAttribute).toBe('ember_type')

  describe "returns false for empty associations", ->
    it "addEmptyHasMany", ->
      expect(@klass.addEmptyHasMany).toBe(false)
    it "addEmptyBelongsTo", ->
      expect(@klass.addEmptyBelongsTo).toBe(false)


describe "DS.CouchDBAdapter" , ->
  beforeEach ->
    self = @
    window.adapter = DS.CouchDBAdapter.create({
      db: 'DB_NAME',
      designDoc: 'DESIGN_DOC',
      _ajax: (url, type, hash) ->
        success = hash.success
        self = this
        window.ajaxUrl = url
        window.ajaxType = type
        window.ajaxHash = hash
        if success
          hash.success = (json) ->
            success.call(self, json)
    })

    window.store = DS.Store.create({
      adapter: window.adapter
    });

    window.Person = DS.Model.extend
      name: DS.attr('string')

    Person.toString = -> 'Person'

    window.Comment = DS.Model.extend
      text: DS.attr('string')

    Comment.toString = -> 'Comment'

    window.Article = DS.Model.extend
      label: DS.attr('string')

    Article.toString = -> 'Article'

    Article.reopen({
      writer: DS.belongsTo(Person),
      comments: DS.hasMany(Comment)
    })

  it "finding a record makes a GET to /DB_NAME/:id", ->
    person = window.store.find(Person, 1)
    window.ajaxHash.success({
      _id: 1,
      _rev: 'abc',
      name: 'Hansi Hinterseer'
    })

    Ember.run.next ->
      expect(person.get('id')).toBe('1')
      expect(person.get('name')).toBe('Hansi Hinterseer')

  it "creating a person makes a POST to /DB_NAME with data hash", ->
    person = window.store.createRecord(Person, {
      name: 'Tobias Fünke'
    })

    window.store.commit()

    Ember.run.next ->
      expectAjaxCall('POST', '/DB_NAME/', {
        name: "Tobias Fünke",
        ember_type: 'Person'
      })

    ajaxHash.success({
      ok: true,
      id: "abc",
      rev: "1-abc"
    })

    Ember.run.next ->
    expect(person.get('name')).toBe("Tobias Fünke")

    Ember.set(person, 'name', "Dr. Funky");
    store.commit()

    Ember.run.next ->
      window.expectAjaxCall('PUT', '/DB_NAME/abc', {
        _id: "abc",
        _rev: "1-abc",
        ember_type: 'Person',
        name: "Dr. Funky"
      })

  it "updating a person makes a PUT to /DB_NAME/:id with data hash", ->
    window.store.load(Person, {
      id: 'abc',
      rev: '1-abc',
      name: 'Tobias Fünke'
    })

    person = store.find(Person, 'abc')
    Ember.set(person, 'name', 'Nelly Fünke')
    store.commit()

    Ember.run.next ->
      expectAjaxCall('PUT', '/DB_NAME/abc', {
        _id: "abc",
        _rev: "1-abc",
        ember_type: 'Person',
        name: "Nelly Fünke"
      })

    ajaxHash.success({
      ok: true,
      id: 'abc',
      rev: '2-def'
    })

    Ember.run.next ->
      expect(Ember.get(person, 'name')).toBe('Nelly Fünke')