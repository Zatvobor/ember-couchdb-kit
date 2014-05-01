Ember.ENV.TESTING = true

module 'EmberCouchDBKit.AttachmentAdapter',
  setup: ->
    unless window.testing
      window.subject = new TestEnv()
      window.testing = true
    @subject = window.subject
    @async = window.async
    @sleep = (ms) ->
      start = new Date().getTime()
      continue while new Date().getTime() - start < ms

test 'create', ->
  expect 1
  user = @subject.create.call @, 'user', id: 'john@example.com1'
  user.save().then @async =>
    rev = user.get '_data.rev'
    params = {
      model_name: 'user'
      doc_id: user.get('id')
      id: "%@/%@".fmt(user.get('id'), "test_image.jpeg")
      file: window.TestImage
      rev: user.get('_data.rev')
      content_type: "image/jpeg"
      length: 4056
      file_name: "test_image.jpeg"
    }
    attachment = @subject.create.call @, 'attachment', params
    attachment.save().then @async ->
      notEqual user.get('_data.rev'), rev, "attachment created"


test 'delete', ->
  rev = @subject.createDocument {id: "user", name: "User"}
  rev = @subject.createAttachment 'user', rev, {id: "user/image1"}
  @subject.createAttachment 'user', rev, {id: "user/image2"}
  #user = @subject.find('user', 'user').then @async (user)->
  @subject.find('user', 'user').then @async (user)->
    attachment = user.get('attachments.firstObject')
    attachment.deleteRecord()
    equal user.get('attachments.length'), 1, 'attachments deleted'
  
      

  ###
  runs ->
    user.get('attachments')
  waitsFor ->
    user.get('attachments.length') != undefined && user.get('attachments.length') != 0
  , 3000
  runs ->
    attachment = user.get('attachments.firstObject')
    attachment.deleteRecord()
    equal user.get('attachments.length'), 1, 'attachments deleted'
  ###



###
describe 'EmberCouchDBKit.AttachmentAdapter' , ->
  beforeEach ->
    unless window.testing
      window.subject = new TestEnv()
      window.testing = true
    @subject = window.subject

  describe 'model operations', ->

    it 'create', ->
      user = @subject.create.call(@, 'user', {id: 'john@example.com1'})
      runs ->
        rev = user.get('_data.rev')
        params = {
          model_name: 'user'
          doc_id: user.get('id')
          id: "%@/%@".fmt(user.get('id'), "test_image.jpeg")
          file: window.TestImage
          rev: user.get('_data.rev')
          content_type: "image/jpeg"
          length: 4056
          file_name: "test_image.jpeg"
        }
        attachment = @subject.create.call(@, 'attachment',params)
        runs ->
          expect(user.get('_data.rev')).not.toEqual(rev)

    it 'delete', ->
      rev = @subject.createDocument({id: "user", name: "User"})
      rev = @subject.createAttachment('user', rev, {id: "user/image1"})
      @subject.createAttachment('user', rev, {id: "user/image2"})
      user = @subject.find('user', 'user')
      runs ->
        user.get('attachments')
      waitsFor ->
        user.get('attachments.length') != undefined && user.get('attachments.length') != 0
      , 3000

      runs ->
        attachment = user.get('attachments.firstObject')
        attachment.deleteRecord()
        expect(user.get('attachments.length')).toEqual(1)

    it 'find', ->
      rev = @subject.createDocument({id: "user1", name: "User"})
      rev = @subject.createAttachment('user1', rev, {id: "user/image1"})
      @subject.createAttachment('user1', rev, {id: "user/image2"})
      user = @subject.find('user', 'user1')
      runs ->
        user.get('attachments')
      waitsFor ->
        user.get('attachments.length') != undefined && user.get('attachments.length') != 0
      , 3000
      runs ->
        expect(user.get('attachments.length')).toEqual(2)
###
