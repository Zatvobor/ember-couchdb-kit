(function() {
  Ember.ENV.TESTING = true;

  window.expectType = function(type) {
    return expect(type).toBe(window.ajaxType);
  };

  window.expectAjaxCall = function(type, url, data) {
    expectType(type);
    return expectUrl(url);
  };

  window.expectUrl = function(url) {
    return expect(url).toBe(window.ajaxUrl);
  };

  describe("DS.CouchDBSerializer", function() {
    beforeEach(function() {
      return this.klass = new DS.CouchDBSerializer();
    });
    it("has been defined", function() {
      return expect(DS.CouchDBSerializer).toBeDefined();
    });
    it("returns typeAttribute", function() {
      return expect(this.klass.typeAttribute).toBe('ember_type');
    });
    return describe("returns false for empty associations", function() {
      it("addEmptyHasMany", function() {
        return expect(this.klass.addEmptyHasMany).toBe(false);
      });
      return it("addEmptyBelongsTo", function() {
        return expect(this.klass.addEmptyBelongsTo).toBe(false);
      });
    });
  });

  describe("DS.CouchDBAdapter", function() {
    beforeEach(function() {
      var self;

      self = this;
      window.adapter = DS.CouchDBAdapter.create({
        db: 'DB_NAME',
        designDoc: 'DESIGN_DOC',
        _ajax: function(url, type, hash) {
          var success;

          success = hash.success;
          self = this;
          window.ajaxUrl = url;
          window.ajaxType = type;
          window.ajaxHash = hash;
          if (success) {
            return hash.success = function(json) {
              return success.call(self, json);
            };
          }
        }
      });
      window.store = DS.Store.create({
        adapter: window.adapter
      });
      window.Person = DS.Model.extend({
        name: DS.attr('string')
      });
      Person.toString = function() {
        return 'Person';
      };
      window.Comment = DS.Model.extend({
        text: DS.attr('string')
      });
      Comment.toString = function() {
        return 'Comment';
      };
      window.Article = DS.Model.extend({
        label: DS.attr('string')
      });
      Article.toString = function() {
        return 'Article';
      };
      return Article.reopen({
        writer: DS.belongsTo(Person),
        comments: DS.hasMany(Comment)
      });
    });
    it("finding a record makes a GET to /DB_NAME/:id", function() {
      var person;

      person = window.store.find(Person, 1);
      window.ajaxHash.success({
        _id: 1,
        _rev: 'abc',
        name: 'Hansi Hinterseer'
      });
      return Ember.run.next(function() {
        expect(person.get('id')).toBe('1');
        return expect(person.get('name')).toBe('Hansi Hinterseer');
      });
    });
    it("creating a person makes a POST to /DB_NAME with data hash", function() {
      var person;

      person = window.store.createRecord(Person, {
        name: 'Tobias Fünke'
      });
      window.store.commit();
      Ember.run.next(function() {
        return expectAjaxCall('POST', '/DB_NAME/', {
          name: "Tobias Fünke",
          ember_type: 'Person'
        });
      });
      ajaxHash.success({
        ok: true,
        id: "abc",
        rev: "1-abc"
      });
      Ember.run.next(function() {});
      expect(person.get('name')).toBe("Tobias Fünke");
      Ember.set(person, 'name', "Dr. Funky");
      store.commit();
      return Ember.run.next(function() {
        return window.expectAjaxCall('PUT', '/DB_NAME/abc', {
          _id: "abc",
          _rev: "1-abc",
          ember_type: 'Person',
          name: "Dr. Funky"
        });
      });
    });
    return it("updating a person makes a PUT to /DB_NAME/:id with data hash", function() {
      var person;

      window.store.load(Person, {
        id: 'abc',
        rev: '1-abc',
        name: 'Tobias Fünke'
      });
      person = store.find(Person, 'abc');
      Ember.set(person, 'name', 'Nelly Fünke');
      store.commit();
      Ember.run.next(function() {
        return expectAjaxCall('PUT', '/DB_NAME/abc', {
          _id: "abc",
          _rev: "1-abc",
          ember_type: 'Person',
          name: "Nelly Fünke"
        });
      });
      ajaxHash.success({
        ok: true,
        id: 'abc',
        rev: '2-def'
      });
      return Ember.run.next(function() {
        return expect(Ember.get(person, 'name')).toBe('Nelly Fünke');
      });
    });
  });

}).call(this);
