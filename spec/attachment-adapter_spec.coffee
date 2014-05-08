Ember.ENV.TESTING = true

module 'EmberCouchDBKit.AttachmentAdapter',
  setup: ->
    unless window.testing
      window.subject = new TestEnv()
      window.testing = true
    @subject = window.subject
    @async = window.async
    @user = ->
      window.subject.create.call @, 'user', id: Math.floor Math.random() * 1000

test 'create', 1, ->
  user = @user()
  user.save().then @async =>
    rev = user.get '_data.rev'
    params =
      model_name: 'user'
      doc_id: user.get 'id'
      id: "%@/%@".fmt user.get('id'), 'test_image.jpeg'
      file: window.TestImage
      rev: user.get '_data.rev'
      content_type: 'image/jpeg'
      length: 4056
      file_name: 'test_image.jpeg'
    attachment = @subject.create.call @, 'attachment', params
    attachment.save().then @async ->
      notEqual user.get('_data.rev'), rev, 'attachment created'

test 'delete', 2, ->
  rev = @subject.createDocument({id: "user0", name: "UserZero"})
  rev = @subject.createAttachment('user0', rev, {id: "user/image3"})
  @subject.createAttachment('user0', rev, {id: "user/image4"})
  @subject.find('user', 'user0').then @async (user) =>
    user.get('attachments').then @async =>
      equal user.get('attachments.length'), 2, 'two attachments exist'
      attachment = user.get('attachments.firstObject')
      attachment.deleteRecord()
      attachment.save().then @async =>
        user.get('attachments').then @async ->
          equal user.get('attachments.length'), 1, 'one attachment gone'

test 'find', 1, ->
  user = @user()
  user.save().then @async =>
    params =
      model_name: 'user'
      doc_id: user.get 'id'
      id: "%@/%@".fmt user.get('id'), 'test_image.jpeg'
      file: window.TestImage
      rev: user.get '_data.rev'
      content_type: 'image/jpeg'
      length: 4056
      file_name: 'test_image.jpeg'
    attachment = @subject.create.call @, 'attachment', params
    attachment.save().then @async =>
      @subject.find('attachment', attachment.id).then @async (rec) ->
        ok rec?, 'finds ok'

test 'hasMany', 1, ->
  rev = @subject.createDocument({id: "user1", name: "User"})
  rev = @subject.createAttachment('user1', rev, {id: "user/image1"})
  @subject.createAttachment('user1', rev, {id: "user/image2"})
  @subject.find('user', 'user1').then @async (user) =>
    user.get('attachments').then @async ->
      equal user.get('attachments.length'), 2, 'okok'
