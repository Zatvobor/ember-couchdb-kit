Ember.ENV.TESTING = true

describe 'EmberCouchDBKit.RevsAdapter', ->

  beforeEach ->
    @subject = new TestEnv()


  it "finds by revision", ->
    person = @subject.create.call(@, 'user', {name: 'name'})

    [rev,id] = [undefined,undefined]

    runs ->
      [id, rev] = [person.id, person.get("_data.rev")]

      person.set('name', 'updated').save()

    waitsFor ->
      rev != person.get("_data._rev")
    ,"update", 3000

    runs ->
      person.reload()
      person.get('history')

      waitsFor ->
        EmberCouchDBKit.RevsStore.registiry["#{id}/history"] != undefined
      , "", 4000

      runs ->
        expect(EmberCouchDBKit.RevsStore.registiry["#{id}/history"]._revs_info.length).toBe(2)
