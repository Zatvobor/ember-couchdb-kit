(function() {
  Ember.ENV.TESTING = true;

  describe('EmberCouchDBKit.RevsAdapter', function() {
    beforeEach(function() {
      return this.subject = new TestEnv();
    });
    it('as belongsTo relation', function() {
      var person;
      person = this.subject.create.call(this, 'user', {
        name: 'name'
      });
      return runs(function() {
        var id, rev, _ref;
        _ref = [person.id, person.get("_data.rev")], id = _ref[0], rev = _ref[1];
        person.set('name', 'updated').save();
        waitsFor(function() {
          return rev !== person.get("_data.rev");
        }, "update", 3000);
        return runs(function() {
          var history;
          history = person.get('history');
          waitsFor(function() {
            return history !== null;
          });
          runs(function() {
            return history.reload();
          });
          waitsFor(function() {
            return EmberCouchDBKit.RevsStore.registiry["" + id + "/history"]._revs_info.length === 2;
          }, "populate registry", 4000);
          return runs(function() {
            var user;
            user = history.get('user');
            waitsFor(function() {
              return user.get('_data.rev') !== void 0;
            });
            return runs(function() {
              return expect(user.get('name')).toEqual('name');
            });
          });
        });
      });
    });
    return xit('as hasMany relation');
  });

}).call(this);
