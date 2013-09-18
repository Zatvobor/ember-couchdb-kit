(function() {
  Ember.ENV.TESTING = true;

  describe('EmberCouchDBKit.RevsAdapter', function() {
    beforeEach(function() {
      return this.subject = new TestEnv();
    });
    return it("finds by revision", function() {
      var id, person, rev, _ref;

      person = this.subject.create.call(this, 'user', {
        name: 'name'
      });
      _ref = [void 0, void 0], rev = _ref[0], id = _ref[1];
      runs(function() {
        var _ref1;

        _ref1 = [person.id, person.get("_data.rev")], id = _ref1[0], rev = _ref1[1];
        return person.set('name', 'updated').save();
      });
      waitsFor(function() {
        return rev !== person.get("_data._rev");
      }, "update", 3000);
      return runs(function() {
        person.reload();
        person.get('history');
        waitsFor(function() {
          return EmberCouchDBKit.RevsStore.registiry["" + id + "/history"] !== void 0;
        }, "", 4000);
        return runs(function() {
          return expect(EmberCouchDBKit.RevsStore.registiry["" + id + "/history"]._revs_info.length).toBe(2);
        });
      });
    });
  });

}).call(this);
