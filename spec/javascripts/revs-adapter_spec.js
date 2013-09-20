(function() {
  Ember.ENV.TESTING = true;

  describe('EmberCouchDBKit.RevsAdapter', function() {
    beforeEach(function() {
      return this.subject = new TestEnv();
    });
    it("finds by revision", function() {
      var id, person, rev, _ref;
      person = this.subject.create.call(this, 'user', {
        name: 'name'
      });
      _ref = [void 0, void 0], rev = _ref[0], id = _ref[1];
      return runs(function() {
        var _ref1;
        _ref1 = [person.id, person.get("_data.rev")], id = _ref1[0], rev = _ref1[1];
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
            return expect(EmberCouchDBKit.RevsStore.registiry["" + id + "/history"]._revs_info.length).toBe(2);
          });
        });
      });
    });
    return it('find prev revision', function() {
      var id, person, rev, _ref;
      person = this.subject.create.call(this, 'user', {
        name: 'name'
      });
      _ref = [void 0, void 0], rev = _ref[0], id = _ref[1];
      return runs(function() {
        var _ref1;
        _ref1 = [person.id, person.get("_data.rev")], id = _ref1[0], rev = _ref1[1];
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
  });

}).call(this);
