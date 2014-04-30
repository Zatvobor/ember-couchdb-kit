Ember.ENV.TESTING = true

describe 'EmberCouchDBKit.RevsAdapter', ->

  beforeEach ->
    unless window.testing
      window.subject = new TestEnv()
      window.testing = true
    @subject = window.subject


  it 'as belongsTo relation', ->
    person = @subject.create.call(@, 'user', {name: 'name'})

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

  it 'as hasMany relation', ->
    person = @subject.create.call(@, 'user', {name: 'name'})
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
          users = history.get('users')
          waitsFor ->
            users.toArray().length != 0
          runs ->
            expect(users.get('firstObject.name')).toEqual('updated')
            expect(users.get('lastObject.name')).toEqual('name')
