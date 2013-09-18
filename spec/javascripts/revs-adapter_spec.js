(function() {
  Ember.ENV.TESTING = true;

  describe('EmberCouchDBKit.RevsAdapter', function() {
    beforeEach(function() {
      return this.subject = new TestEnv();
    });
    return it("finds by revision", function() {
      var id, person, prevRev;
      person = this.subject.create.call(this, Fixture.Person, {
        name: 'Person'
      });
      prevRev = void 0;
      id = void 0;
      runs(function() {
        id = person.id;
        prevRev = person.get("_data._rev");
        person.set('name', 'updatedName');
        return person.save();
      });
      waitsFor(function() {
        return prevRev !== person.get("_data._rev");
      }, "", 3000);
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
