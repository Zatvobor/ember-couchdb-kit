Ember.ENV.TESTING = true

#TODO: update strings in waitFor

describe 'EmberCouchDBKit.DocumentAdapter' , ->
  beforeEach ->
    DatabaseCleaner.reset()
    @subject = new TestEmberApp()

  describe 'Create', ->

    it 'creates single record', ->
      ['Dummy name', 'Test'].forEach (name) =>
        person = @subject.createPerson.call(@, {name: name})
        runs ->
          expect(person.id).not.toBeNull()
          expect(person.get('name')).toBe(name)

    it 'creates record with belongsTo relation', ->
      name = 'Vpupkin'
      person = @subject.createPerson.call(@, {name: name})

      runs ->
        article = @subject.createArticle.call(@, {label: 'Label', person: person})
        runs ->
          expect(article.get('person.name')).toBe(name)

    it 'creates record with hasMany', ->
      comment = @subject.createComment.call(@, {text: 'Text'})

      article = undefined

      runs ->
        article = @subject.createArticle.call(@, {label: 'Label', comments: []})

      runs ->
        article.get('comments').pushObject(comment)
        article.save()

      waitsFor ->
        article.get('_data.raw').comments != undefined
      ,"", 3000

      runs ->
        expect(article.get('_data.raw').comments[0]).toBe comment.id

  describe 'Update', ->

    it 'updates single record', ->
      person = @subject.createPerson.call(@, {name: "Vpupkin"})

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

    it 'updates update belongsTo relation', ->
      name = 'Vpupkin'
      newName = 'Bobby'

      person1 = @subject.createPerson.call(@, {name: name})

      article = undefined
      prevRev = undefined
      person2 = undefined

      runs ->
        article = @subject.createArticle.call(@, {label: 'Label', person: person1})

      runs ->
        prevRev =  article.get("_data._rev")
        person2 = @subject.createPerson.call(@, {name: newName})

      runs ->
        article.set('person', person2)
        article.save()

      waitsFor ->
        prevRev != article.get("_data._rev")
      ,"", 3000

      runs ->
        expect(prevRev).not.toEqual(article.get("_data._rev"))
        expect(article.get('person.name')).toEqual(newName)

  it 'updates hasMany relation', ->
    comment = @subject.createComment.call(@, {text: 'Text'})

    article = undefined

    runs ->
      article = @subject.createArticle.call(@, {label: 'Label', comments: []})

    runs ->
      article.get('comments').pushObject(comment)
      article.save()

    waitsFor ->
      article.get('_data.raw').comments != undefined
    ,"", 3000

    runs ->
      expect(article.get('comments').toArray().length).toEqual(1)


















