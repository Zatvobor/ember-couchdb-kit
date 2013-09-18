Ember.ENV.TESTING = true

describe 'EmberCouchDBKit.DocumentAdapter' , ->
  beforeEach ->
    @subject = new TestEnv()

  describe 'model creation', ->

    it 'record with specific id', ->
      person = @subject.create.call(@, 'user', {id: 'john@example.com'})

      runs ->
        expect(person.id).toBe('john@example.com')
        expect(person.get('_data.rev')).not.toBeNull()
        expect(person.get('_data.rev')).not.toBeUndefined()

    it 'record with generated id', ->
      person = @subject.create.call(@, 'user', {})

      runs ->
        expect(person.id).not.toBeNull()


    it 'simple {a:"a", b:"b"} model', ->
      person = @subject.create.call(@, 'user', {a: 'a', b: 'b'})

      runs ->
        expect(person.get('a')).toBe('a')
        expect(person.get('b')).toBe('b')


    it 'always available as a raw json object', ->
      person = @subject.create.call(@, 'user', {name: 'john'})

      runs ->
        expect(person.get('_data').name).toBe('john')

    it 'belongsTo relation', ->
      person = @subject.create.call(@, 'user', {name: 'john'})

      runs ->
        article = @subject.create.call(@, 'article', {})
        runs ->
          article.set('user', person)
          article.save()

          waitsFor ->
            article.get('_data.user') != null

          runs ->
            expect(article.get('user.name')).toBe('john')

    it 'belongsTo field avilable as a raw js object', ->
      person = @subject.create.call(@, 'user', {name: 'john'})

      runs ->
        message = @subject.create.call(@, 'message', {user: person})
        runs ->
          expect(message.get('_data.user.id')).toBe('john')

    it 'with hasMany', ->
      comment = @subject.create.call(@, 'comment', {text: 'text'})
      article = undefined

      runs ->
        article = @subject.create.call(@, 'article', {label: 'Label', comments: []})

      oldRev = undefined

      runs ->
        oldRev = article.get("_data.rev")
        article.set('comments.content', [])
        article.get('comments').pushObject(comment)
        article.save()

      waitsFor ->
        article.get('_data.rev') != oldRev
      ,"", 3000

      runs ->
        expect(article.get('_data').comments[0].id).toBe(comment.id)

  describe 'model updating', ->

    it 'in general', ->
      person = @subject.create.call(@, 'user', {name: "John"})
      prevRev = undefined

      runs ->
        prevRev = person.get("_data.rev")
        person.set('name', 'Bobby')
        person.save()

      waitsFor ->
        prevRev != person.get("_data.rev")
      ,"", 3000

      runs ->
        expect(prevRev).not.toEqual(person.get("_data.rev"))

    it 'belongsTo relation', ->
      name = 'Vpupkin'
      newName = 'Bobby'

      person1 = @subject.create.call(@, 'user', {name: name})

      article = undefined
      prevRev = undefined
      person2 = undefined

      runs ->
        article = @subject.create.call(@, 'article', {label: 'Label', user: person1})

      runs ->
        prevRev =  article.get("_data.rev")
        person2 = @subject.create.call(@, 'user', {name: newName})

      runs ->
        article.set('user', person2)
        article.save()

      waitsFor ->
        prevRev != article.get("_data.rev")
      ,"", 3000

      runs ->
        expect(prevRev).not.toEqual(article.get("_data.rev"))
        expect(article.get('user.id')).toEqual(person2.id)


# see for this issue https://github.com/emberjs/data/issues/1228

#    it 'updates hasMany relation', ->
#      comment = @subject.create.call(@, 'comment', {text: 'Text'})
#
#      article = undefined
#      comment2 = undefined
#
#      runs ->
#        article = @subject.create.call(@, 'article', {label: 'Label', comments: []})
#
#      runs ->
#        article.set('comments.content', [])
#        article.get('comments').pushObject(comment)
#        article.save()
#
#      waitsFor ->
#        article.get('_data').comments != undefined
#      ,"", 3000
#
#      runs ->
#        expect(article.get('comments').toArray().length).toEqual(1)
#        comment2 = @subject.create.call(@, 'comment', {text: 'Text2'})
#
#      runs ->
#        article.get('comments').pushObject(comment2)
#        article.save()
#
#      waitsFor ->
#        article.get('_data').comments != undefined && article.get('_data').comments.length == 2
#      ,"", 3000
#
#      runs ->
#        expect(article.get('comments').toArray().length).toEqual(2)


  describe "deletion", ->

    it "in general", ->
      person = @subject.create.call(@, 'user', {name: 'Vpupkin'})

      runs ->
        person.deleteRecord()
        person.save()
        expect(person.get('isDeleted')).toBe(true)