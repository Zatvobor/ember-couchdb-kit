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
  person.save().then @async =>
    person.set('name', 'updated')
    person.save().then @async ->
      history = person.get 'history'
      user = history.get '_.data.user'
      equals user.get('name'), 'name', 'belongs ok'

test 'hasMany relation', 1, ->
  person = @subject.create.call @, 'user', name: 'name'
  person.save().then @async =>
    person.set 'name', 'updated'
    person.save().then @async ->
      history = person.get 'history'
      ok history.get('_.data.users.length') is 2, 'has many'
