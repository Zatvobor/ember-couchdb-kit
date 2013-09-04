(function() {
  Ember.ENV.TESTING = true;

  describe('EmberCouchDBKit.DocumentAdapter', function() {
    beforeEach(function() {
      DatabaseCleaner.reset();
      return this.subject = new TestEmberApp();
    });
    describe('Create', function() {
      it('creates single record', function() {
        var _this = this;

        return ['Dummy name', 'Test'].forEach(function(name) {
          var person;

          person = _this.subject.createPerson.call(_this, {
            name: name
          });
          return runs(function() {
            expect(person.id).not.toBeNull();
            return expect(person.get('name')).toBe(name);
          });
        });
      });
      it('setups raw json into record', function() {
        var person;

        person = this.subject.createPerson.call(this, {
          name: 'Boddy'
        });
        return runs(function() {
          return expect(person.get('_data.raw').name).toEqual('Boddy');
        });
      });
      it('creates record with belongsTo relation', function() {
        var name, person;

        name = 'Vpupkin';
        person = this.subject.createPerson.call(this, {
          name: name
        });
        return runs(function() {
          var article;

          article = this.subject.createArticle.call(this, {
            label: 'Label',
            person: person
          });
          return runs(function() {
            return expect(article.get('person.name')).toBe(name);
          });
        });
      });
      it('creates record with belongsTo field', function() {
        var name, person;

        App.Message = DS.Model.extend({
          label: DS.attr('string'),
          person: DS.belongsTo(App.Person),
          comments: DS.hasMany(App.Comment),
          person_key: "name"
        });
        name = 'Vpupkin';
        person = this.subject.createPerson.call(this, {
          name: name
        });
        return runs(function() {
          var message;

          message = this.subject.createMessage.call(this, {
            label: 'Label',
            person: person
          });
          return runs(function() {
            return expect(message.get('_data.raw').person).toBe(name);
          });
        });
      });
      return it('creates record with hasMany', function() {
        var article, comment;

        comment = this.subject.createComment.call(this, {
          text: 'Text'
        });
        article = void 0;
        runs(function() {
          return article = this.subject.createArticle.call(this, {
            label: 'Label',
            comments: []
          });
        });
        runs(function() {
          article.get('comments').pushObject(comment);
          return article.save();
        });
        waitsFor(function() {
          return article.get('_data.raw').comments !== void 0;
        }, "", 3000);
        return runs(function() {
          return expect(article.get('_data.raw').comments[0]).toBe(comment.id);
        });
      });
    });
    describe('Update', function() {
      it('updates single record', function() {
        var person, prevRev;

        person = this.subject.createPerson.call(this, {
          name: "Vpupkin"
        });
        prevRev = void 0;
        runs(function() {
          prevRev = person.get("_data._rev");
          person.set('name', 'Bobby');
          return person.save();
        });
        waitsFor(function() {
          return prevRev !== person.get("_data._rev");
        }, "", 3000);
        return runs(function() {
          return expect(prevRev).not.toEqual(person.get("_data._rev"));
        });
      });
      it('updates update belongsTo relation', function() {
        var article, name, newName, person1, person2, prevRev;

        name = 'Vpupkin';
        newName = 'Bobby';
        person1 = this.subject.createPerson.call(this, {
          name: name
        });
        article = void 0;
        prevRev = void 0;
        person2 = void 0;
        runs(function() {
          return article = this.subject.createArticle.call(this, {
            label: 'Label',
            person: person1
          });
        });
        runs(function() {
          prevRev = article.get("_data._rev");
          return person2 = this.subject.createPerson.call(this, {
            name: newName
          });
        });
        runs(function() {
          article.set('person', person2);
          return article.save();
        });
        waitsFor(function() {
          return prevRev !== article.get("_data._rev");
        }, "", 3000);
        return runs(function() {
          expect(prevRev).not.toEqual(article.get("_data._rev"));
          return expect(article.get('person.name')).toEqual(newName);
        });
      });
      return it('updates hasMany relation', function() {
        var article, comment, comment2;

        comment = this.subject.createComment.call(this, {
          text: 'Text'
        });
        article = void 0;
        comment2 = void 0;
        runs(function() {
          return article = this.subject.createArticle.call(this, {
            label: 'Label',
            comments: []
          });
        });
        runs(function() {
          article.get('comments').pushObject(comment);
          return article.save();
        });
        waitsFor(function() {
          return article.get('_data.raw').comments !== void 0;
        }, "", 3000);
        runs(function() {
          expect(article.get('comments').toArray().length).toEqual(1);
          return comment2 = this.subject.createComment.call(this, {
            text: 'Text2'
          });
        });
        runs(function() {
          article.get('comments').pushObject(comment2);
          return article.save();
        });
        waitsFor(function() {
          return article.get('_data.raw').comments !== void 0 && article.get('_data.raw').comments.length === 2;
        }, "", 3000);
        return runs(function() {
          return expect(article.get('comments').toArray().length).toEqual(2);
        });
      });
    });
    return describe("deletes", function() {
      return it("deletes Record", function() {
        var person;

        person = this.subject.createPerson.call(this, {
          name: 'Vpupkin'
        });
        return runs(function() {
          person.deleteRecord();
          person.save();
          return expect(person.get('isDeleted')).toBe(true);
        });
      });
    });
  });

}).call(this);
