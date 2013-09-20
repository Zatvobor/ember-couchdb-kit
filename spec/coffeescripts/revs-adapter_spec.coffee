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
        rev != person.get("_data.rev")
      ,"update", 3000

      runs ->
        history = person.get('history')
        waitsFor ->
          history != null

        runs ->
          history.reload()

        waitsFor ->
          EmberCouchDBKit.RevsStore.registiry["#{id}/history"]._revs_info.length == 2
        , "populate registry", 4000

        runs ->
          expect(EmberCouchDBKit.RevsStore.registiry["#{id}/history"]._revs_info.length).toBe(2)

  it 'find prev revision', ->
    person = @subject.create.call(@, 'user', {name: 'name'})

    [rev,id] = [undefined,undefined]

    runs ->
      [id, rev] = [person.id, person.get("_data.rev")]

      person.set('name', 'updated').save()

      waitsFor ->
        rev != person.get("_data.rev")
      ,"update", 3000

      runs ->
        history = person.get('history')
        waitsFor ->
          history != null

        runs ->
          history.reload()

        waitsFor ->
          EmberCouchDBKit.RevsStore.registiry["#{id}/history"]._revs_info.length == 2
        , "populate registry", 4000
        runs ->
          user = history.get('user')
          waitsFor ->
            user.get('_data.rev') != undefined
          runs ->
            expect(user.get('name')).toEqual('name')