Ember.ENV.TESTING = true

#TODO: update strings in waitFor

describe 'EmberCouchDBKit.RevsAdapter', ->
  beforeEach ->
#    DatabaseCleaner.reset()
    @subject = new TestEmberApp()

  it "finds by revision", ->
    person = @subject.createPerson.call(@, {name: 'Person'})

    prevRev = undefined
    id = undefined

    runs ->
      id = person.id
      prevRev = person.get("_data._rev")
      person.set('name', 'updatedName')
      person.save()

    waitsFor ->
      prevRev != person.get("_data._rev")
    ,"", 3000

    runs ->
      person.reload()
      person.get('history')

      waitsFor ->
        EmberCouchDBKit.RevsStore.registiry["#{id}/history"] != undefined
      , "", 4000

      runs ->
        expect(EmberCouchDBKit.RevsStore.registiry["#{id}/history"]._revs_info.length).toBe(2)