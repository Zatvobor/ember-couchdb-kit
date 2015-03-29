Ember.ENV.TESTING = true
module 'EmberCouchDBKit.RevsAdapter',
  setup: ->
    unless window.testing
      window.subject = new TestEnv()
      window.testing = true
    @subject = window.subject
    @async = window.async

test 'belongsTo relation', 1, ->
  person = @subject.create.call @, 'user', name: 'name'
  person.save().then @async (saved) =>
    saved.set 'name', 'updated'
    saved.save().then @async (updated) =>
      stop()
      history = updated.get 'history'
      console.log(history)
      setTimeout =>
        history.reload()
        setTimeout =>
          start()
          console.log(history.get('_data'))
          equal history.get('user.id').split('/')[0], person.id, 'history belongsTo user'
        , 1000
      , 1000

test 'hasMany relation', 1, ->
  person = @subject.create.call @, 'user', name: 'john'
  person.save().then @async (saved) =>
    saved.set 'name', 'updatedJohn'
    saved.save().then @async (updated) =>
      stop()
      history = updated.get 'history'
      setTimeout =>
        history.reload()
        setTimeout =>
          history.get('users')
          setTimeout =>
            start()
            console.log(length)
            equal history.get('users.length'), 2, 'history hasMany users'
          , 1000
        , 1000
      , 1000
