(function() {
  Ember.ENV.TESTING = true;

  describe('EmberCouchDBKit.DocumentAdapter', function() {
    beforeEach(function() {
      return this.subject = new TestEnv();
    });
    describe('model creation', function() {
      it('record with specific id', function() {
        var person;
        person = this.subject.create.call(this, 'user', {
          id: 'john@example.com'
        });
        return runs(function() {
          expect(person.id).toBe('john@example.com');
          expect(person.get('_data.rev')).not.toBeNull();
          return expect(person.get('_data.rev')).not.toBeUndefined();
        });
      });
      it('record with generated id', function() {
        var person;
        person = this.subject.create.call(this, 'user', {});
        return runs(function() {
          return expect(person.id).not.toBeNull();
        });
      });
      it('simple {a:"a", b:"b"} model', function() {
        var person;
        person = this.subject.create.call(this, 'user', {
          a: 'a',
          b: 'b'
        });
        return runs(function() {
          expect(person.get('a')).toBe('a');
          return expect(person.get('b')).toBe('b');
        });
      });
      it('always available as a raw json object', function() {
        var person;
        person = this.subject.create.call(this, 'user', {
          name: 'john'
        });
        return runs(function() {
          return expect(person.get('_data').name).toBe('john');
        });
      });
      it('belongsTo relation', function() {
        var person;
        person = this.subject.create.call(this, 'user', {
          name: 'john'
        });
        return runs(function() {
          var article;
          article = this.subject.create.call(this, 'article', {});
          return runs(function() {
            article.set('user', person);
            article.save();
            waitsFor(function() {
              return article.get('_data.user') !== null;
            });
            return runs(function() {
              return expect(article.get('user.name')).toBe('john');
            });
          });
        });
      });
      it('belongsTo field avilable as a raw js object', function() {
        var person;
        person = this.subject.create.call(this, 'user', {
          name: 'john'
        });
        return runs(function() {
          var message;
          message = this.subject.create.call(this, 'message', {
            user: person
          });
          return runs(function() {
            return expect(message.get('_data.user.id')).toBe('john');
          });
        });
      });
      return it('with hasMany', function() {
        var article, comment, oldRev;
        comment = this.subject.create.call(this, 'comment', {
          text: 'text'
        });
        article = void 0;
        runs(function() {
          return article = this.subject.create.call(this, 'article', {
            label: 'Label',
            comments: []
          });
        });
        oldRev = void 0;
        runs(function() {
          oldRev = article.get("_data.rev");
          article.set('comments.content', []);
          article.get('comments').pushObject(comment);
          return article.save();
        });
        waitsFor(function() {
          return article.get('_data.rev') !== oldRev;
        }, "", 3000);
        return runs(function() {
          return expect(article.get('_data').comments[0].id).toBe(comment.id);
        });
      });
    });
    describe('model updating', function() {
      it('in general', function() {
        var person, prevRev;
        person = this.subject.create.call(this, 'user', {
          name: "John"
        });
        prevRev = void 0;
        runs(function() {
          prevRev = person.get("_data.rev");
          person.set('name', 'Bobby');
          return person.save();
        });
        waitsFor(function() {
          return prevRev !== person.get("_data.rev");
        }, "", 3000);
        return runs(function() {
          return expect(prevRev).not.toEqual(person.get("_data.rev"));
        });
      });
      it('belongsTo relation', function() {
        var article, name, newName, person1, person2, prevRev;
        name = 'Vpupkin';
        newName = 'Bobby';
        person1 = this.subject.create.call(this, 'user', {
          name: name
        });
        article = void 0;
        prevRev = void 0;
        person2 = void 0;
        runs(function() {
          return article = this.subject.create.call(this, 'article', {
            label: 'Label',
            user: person1
          });
        });
        runs(function() {
          prevRev = article.get("_data.rev");
          return person2 = this.subject.create.call(this, 'user', {
            name: newName
          });
        });
        runs(function() {
          article.set('user', person2);
          return article.save();
        });
        waitsFor(function() {
          return prevRev !== article.get("_data.rev");
        }, "", 3000);
        return runs(function() {
          expect(prevRev).not.toEqual(article.get("_data.rev"));
          return expect(article.get('user.id')).toEqual(person2.id);
        });
      });
      it('updates hasMany relation', function() {
        var article, comment, comment2;
        comment = this.subject.create.call(this, 'comment', {
          text: 'Text'
        });
        article = void 0;
        comment2 = void 0;
        runs(function() {
          return article = this.subject.create.call(this, 'article', {
            label: 'Label',
            comments: []
          });
        });
        runs(function() {
          article.get('comments').pushObject(comment);
          return article.save();
        });
        waitsFor(function() {
          return article.get('_data').comments !== void 0;
        }, "", 3000);
        runs(function() {
          expect(article.get('comments').toArray().length).toEqual(1);
          return comment2 = this.subject.create.call(this, 'comment', {
            text: 'Text2'
          });
        });
        runs(function() {
          article.get('comments').pushObject(comment2);
          return article.save();
        });
        waitsFor(function() {
          return article.get('_data').comments !== void 0 && article.get('_data').comments.length === 2;
        }, "", 3000);
        return runs(function() {
          return expect(article.get('comments').toArray().length).toEqual(2);
        });
      });
      return it("update hasMany without load", function() {
        var article, rev,
          _this = this;
        rev = this.subject.createDocument({
          id: "article8",
          label: 'Label',
          comments: ["comment1", "comment2"]
        });
        this.subject.createDocument({
          id: "comment1"
        });
        this.subject.createDocument({
          id: "comment2"
        });
        article = void 0;
        return runs(function() {
          window.Fixture.store.find('article', 'article8').then(function(m) {
            return article = m;
          });
          waitsFor(function() {
            return article !== void 0;
          });
          return runs(function() {
            expect(article.get('_data').comments.length).toEqual(2);
            article.set('label', 'updated label');
            article.save();
            waitsFor(function() {
              return article.get('data._rev') !== rev;
            });
            return runs(function() {
              return expect(article.get('_data').comments.length).toEqual(2);
            });
          });
        });
      });
    });
    describe("deletion", function() {
      return it("in general", function() {
        var person;
        person = this.subject.create.call(this, 'user', {
          name: 'Vpupkin'
        });
        return runs(function() {
          person.deleteRecord();
          person.save();
          return expect(person.get('isDeleted')).toBe(true);
        });
      });
    });
    return describe("find", function() {
      it("by id", function() {
        var user;
        this.subject.createDocument({
          id: "findId",
          name: "Some Name"
        });
        user = this.subject.find('user', 'findId');
        return runs(function() {
          return expect(user.get('name')).toEqual('Some Name');
        });
      });
      it('by ids', function() {
        var article;
        this.subject.createDocument({
          id: "comment1",
          text: "Some text"
        });
        this.subject.createDocument({
          id: "comment2",
          text: "Some text"
        });
        this.subject.createDocument({
          id: "article",
          comments: ["comment1", "comment2"],
          label: "some label"
        });
        article = this.subject.find('article', 'article');
        return runs(function() {
          article.get('comments');
          waitsFor(function() {
            return article.get('comments.length') !== void 0 && article.get('comments.length') !== 0;
          });
          return runs(function() {
            return article.get('comments').forEach(function(comment) {
              return expect(comment.get('text')).toEqual('Some text');
            });
          });
        });
      });
      return it("by query", function() {
        var comments;
        this.subject.createDocument({
          id: "comment1",
          text: "Some text",
          type: "comment"
        });
        this.subject.createDocument({
          id: "comment2",
          text: "Some text",
          type: "comment"
        });
        this.subject.createView("byComment");
        comments = this.subject.findQuery('comment', {
          designDoc: "comments",
          viewName: "all"
        });
        return runs(function() {
          return expect(comments.toArray().length).toEqual(2);
        });
      });
    });
  });

}).call(this);
