Ember.ENV.TESTING = true

module 'EmberCouchDBKit.DocumentAdapter',
  setup: ->
    unless window.testing
      window.subject = new TestEnv()
      window.testing = true
    @subject = window.subject
    @async = window.async

test 'create record with given id', 1, ->
  person = @subject.create.call @, 'user', id: 'john@example.com'
  equal person.id, 'john@example.com', 'Id is correct'

test 'create record with correct attributes', 2, ->
  person = @subject.create.call @, 'user', a: 'a', b: 'b'
  equal person.get('a'), 'a', 'attr is correct'
  equal person.get('b'), 'b', 'attr is correct'

test 'retrieve raw json', 1, ->
  person = @subject.create.call @, 'user', name: 'john', id: Math.floor Math.random() * 10000
  person.save().then @async ->
    equal person.get('_data').name, 'john', 'Retrieve raw json ok'

test 'belongsTo relation', 1, ->
  person = @subject.create.call @, 'user', id: Math.floor(Math.random() * 10000), name: 'john'
  article = @subject.create.call @, 'article', label: 'lbl', user: person
  equal article.get('user.name'), 'john', 'Retrieves relations attrs ok'

test 'retrieve belongsTo field as raw json', 1, ->
  person = @subject.create.call @, 'user', id: Math.floor(Math.random() * 10000), name: 'john'
  message = @subject.create.call @, 'message', user: person
  message.save().then @async ->
    equal message.get('_data.user'), person.get('name'), 'Retrieves raw belongsTo json ok'

test 'hasMany relation', 1, ->
  article = @subject.create.call @, 'article', label: 'Label'
  article.save().then @async =>
    comment = @subject.create.call @, 'comment', text: 'text', article: article
    article.save().then @async ->
      equal article.get('comments.firstObject.id'), comment.id, 'Handles hasMany relation ok'

test 'update', 1, ->
  person = @subject.create.call @, 'user', id: Math.floor(Math.random() * 10000), name: 'john'
  person.save().then @async =>
    rev = person.get '_data.rev'
    person.set 'name', 'paul'
    person.save().then @async ->
      ok person.get('_data.rev') isnt rev, 'Increments rev on update'

test 'update belongsTo relation', 1, ->
  person1 = @subject.create.call @, 'user', id: Math.floor(Math.random() * 10000), name: 'john'
  person2 = @subject.create.call @, 'user', id: Math.floor(Math.random() * 10000), name: 'paul'
  article = @subject.create.call @, 'article', label: 'lbl', user: person1
  article.set 'user', person2
  article.save().then @async ->
    equal article.get('user.id'), person2.id, 'Updates parent relation'

test 'delete', 1, ->
  person = @subject.create.call @, 'user', id: Math.floor(Math.random() * 10000), name: 'john'
  person.save().then @async =>
    person.deleteRecord()
    person.save().then @async ->
      ok person.get('isDeleted'), 'Marks record deleted'

test 'find by id', 1, ->
  person = @subject.create.call @, 'user', id: Math.floor(Math.random() * 10000), name: 'john'
  @subject.find('user', person.id).then @async (user) ->
    equal user.get('name'), 'john', 'Finds record by id'
