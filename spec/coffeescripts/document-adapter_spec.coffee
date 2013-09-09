Ember.ENV.TESTING = true

describe 'EmberCouchDBKit.DocumentAdapter' , ->
  beforeEach ->
    @subject = new TestEnv()

  describe 'model creation', ->

    it 'record with specific id', ->
      person = @subject.create.call(@, Fixture.Person, {id: 'john@example.com'})

      runs ->
        expect(person.id).toBe('john@example.com')


    it 'record with generated id', ->
      person = @subject.create.call(@, Fixture.Person, {})

      runs ->
        expect(person.id).not.toBeNull()


    it 'simple {a:"a", b:"b"} model', ->
      person = @subject.create.call(@, Fixture.Person, {a: 'a', b: 'b'})

      runs ->
        expect(person.get('a')).toBe('a')
        expect(person.get('b')).toBe('b')


    it 'always available as a raw json object', ->
      person = @subject.create.call(@, Fixture.Person, {name: 'john'})

      runs ->
        expect(person.get('_data.raw').name).toBe('john')

    it 'belongsTo relation', ->
      person = @subject.create.call(@, Fixture.Person, {name: 'john'})

      runs ->
        article = @subject.create.call(@, Fixture.Article, {person: person})
        runs ->
          expect(article.get('person.name')).toBe('john')

    it 'belongsTo field avilable as a raw js object', ->
      Fixture.Message = DS.Model.extend
        person: DS.belongsTo(Fixture.Person),
        person_key: "name"

      person = @subject.create.call(@, Fixture.Person, {name: 'john'})

      runs ->
        message = @subject.create.call(@, Fixture.Message, {person: person})
        runs ->
          expect(message.get('_data.raw').person).toBe('john')


    it 'with hasMany', ->
      comment = @subject.create.call(@, Fixture.Comment, {text: 'text'})
      article = @subject.create.call(@, Fixture.Article, {label: 'label'})

      runs ->
        article.get('comments').pushObject(comment)
        article.save()

      waitsFor ->
        article.get('_data.raw').comments != undefined
      ,"", 3000

      runs ->
        expect(article.get('comments').toArray()[0]).toBe(comment)

    it 'with unsaved model in hasMany', ->
      article = @subject.create.call(@, Fixture.Article, {label: 'label'})
      comment = Fixture.Comment.createRecord({text: 'text'})

      runs ->
        article.get('comments').pushObject(comment)
        comment.save()

      waitsFor ->
        comment.id != null 
      , "saving commment", 3000

      runs ->
        article.save()

      waitsFor ->
        article.get('_data.raw').comments != undefined
      , "saving article", 3000

      runs ->
        expect(article.get('comments').objectAt(0)).toBe(comment)

  describe 'model updating', ->

    it 'in general', ->
      person = @subject.create.call(@, Fixture.Person, {name: "John"})
      prevRev = undefined

      runs ->
        prevRev = person.get("_data._rev")
        person.set('name', 'Bobby')
        person.save()

      waitsFor ->
        prevRev != person.get("_data._rev")
      ,"", 3000

      runs ->
        expect(prevRev).not.toEqual(person.get("_data._rev"))

    it 'with belongsTo', ->
      name = 'Vpupkin'
      newName = 'Bobby'

      person1 = @subject.create.call(@, Fixture.Person, {name: name})

      article = undefined
      prevRev = undefined
      person2 = undefined

      runs ->
        article = @subject.create.call(@, Fixture.Article, {label: 'Label', person: person1})

      runs ->
        prevRev =  article.get("_data._rev")
        person2 = @subject.create.call(@, Fixture.Person, {name: newName})

      runs ->
        article.set('person', person2)
        article.save()

      waitsFor ->
        prevRev != article.get("_data._rev")
      ,"", 3000

      runs ->
        expect(prevRev).not.toEqual(article.get("_data._rev"))
        expect(article.get('person.name')).toEqual(newName)

    it 'with hasMany', ->
      article = @subject.create.call(@, Fixture.Article, {label: 'label'})

      comment  = undefined
      comment1 = undefined

      runs ->
        comment  = @subject.create.call(@, Fixture.Comment, {text: 'text'})
        comment1 = @subject.create.call(@, Fixture.Comment, {text: 'text 1'})

      runs ->
        article.get('comments').pushObjects([comment, comment1])
        article.save()

      waitsFor ->
        article.get('_data.raw').comments != undefined && article.get('_data.raw').comments.length == 2
      , "Article saving with comments", 3000

      runs ->
        expect(article.get('comments').toArray().length).toEqual(2)


  describe "deletion", ->

    it "in general", ->
      person = @subject.create.call(@, Fixture.Person, {name: 'Vpupkin'})

      runs ->
        person.deleteRecord()
        person.save()
        expect(person.get('isDeleted')).toBe(true)
