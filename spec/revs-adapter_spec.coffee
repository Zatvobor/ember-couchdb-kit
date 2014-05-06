Ember.ENV.TESTING = true
module 'EmberCouchDBKit.RevsAdapter',
  setup: ->
    unless window.testing
      window.subject = new TestEnv()
      window.testing = true
    @subject = window.subject
    @async = window.async
    @randId = ->
      Math.floor Math.random() * 10000

test 'belongsTo relation', 1, ->
  person = @subject.create.call @, 'user', id: @randId(), name: 'name'
  person.save().then @async =>
    person.set 'name', 'updated'
    person.save().then @async ->
      equal person.get('history').get('user.id').split('/')[0], person.id, 'belongs ok'

test 'hasMany relation', 1, ->
  person = @subject.create.call @, 'user', id: @randId(), name: 'john'
  person.save().then @async =>
    person.set 'name', 'updatedJohn'
    person.save().then @async =>
      equal person.get('history').get('_data.users.length'), 1, 'hasMany ok'
