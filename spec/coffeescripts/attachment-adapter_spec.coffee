Ember.ENV.TESTING = true

describe 'EmberCouchDBKit.AttachmentAdapter' , ->
  beforeEach ->
    @subject = new TestEnv()

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
