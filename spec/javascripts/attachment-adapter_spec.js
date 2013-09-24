(function() {
  Ember.ENV.TESTING = true;

  describe('EmberCouchDBKit.AttachmentAdapter', function() {
    beforeEach(function() {
      return this.subject = new TestEnv();
    });
    return describe('model operations', function() {
      it('create', function() {
        var user;
        user = this.subject.create.call(this, 'user', {
          id: 'john@example.com1'
        });
        return runs(function() {
          var attachment, params, rev;
          rev = user.get('_data.rev');
          params = {
            model_name: 'user',
            doc_id: user.get('id'),
            id: "%@/%@".fmt(user.get('id'), "test_image.jpeg"),
            file: window.TestImage,
            rev: user.get('_data.rev'),
            content_type: "image/jpeg",
            length: 4056,
            file_name: "test_image.jpeg"
          };
          attachment = this.subject.create.call(this, 'attachment', params);
          return runs(function() {
            return expect(user.get('_data.rev')).not.toEqual(rev);
          });
        });
      });
      it('delete', function() {
        var rev, user;
        rev = this.subject.createDocument({
          id: "user",
          name: "User"
        });
        rev = this.subject.createAttachment('user', rev, {
          id: "user/image1"
        });
        this.subject.createAttachment('user', rev, {
          id: "user/image2"
        });
        user = this.subject.find('user', 'user');
        runs(function() {
          return user.get('attachments');
        });
        waitsFor(function() {
          return user.get('attachments.length') !== void 0 && user.get('attachments.length') !== 0;
        }, 3000);
        return runs(function() {
          var attachment;
          attachment = user.get('attachments.firstObject');
          attachment.deleteRecord();
          return expect(user.get('attachments.length')).toEqual(1);
        });
      });
      return it('find', function() {
        var rev, user;
        rev = this.subject.createDocument({
          id: "user1",
          name: "User"
        });
        rev = this.subject.createAttachment('user1', rev, {
          id: "user/image1"
        });
        this.subject.createAttachment('user1', rev, {
          id: "user/image2"
        });
        user = this.subject.find('user', 'user1');
        runs(function() {
          return user.get('attachments');
        });
        waitsFor(function() {
          return user.get('attachments.length') !== void 0 && user.get('attachments.length') !== 0;
        }, 3000);
        return runs(function() {
          return expect(user.get('attachments.length')).toEqual(2);
        });
      });
    });
  });

}).call(this);
