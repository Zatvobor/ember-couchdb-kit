(function() {
  this.DatabaseCleaner = (function() {
    function DatabaseCleaner() {}

    DatabaseCleaner.reset = function() {
      this.destroy();
      return this.create();
    };

    DatabaseCleaner.create = function() {
      return this._ajax('PUT');
    };

    DatabaseCleaner.destroy = function() {
      return this._ajax('DELETE');
    };

    DatabaseCleaner._ajax = function(type) {
      return jQuery.ajax({
        url: "/doc",
        type: type,
        dataType: 'json',
        contentType: "application/json",
        cache: true,
        async: false
      });
    };

    return DatabaseCleaner;

  })();

  this.TestEnv = (function() {
    function TestEnv() {
      DatabaseCleaner.reset();
      if (!window.App) {
        window.Fixture = Ember.Application.create({
          rootElement: "body"
        });
        this.adapter();
        this.store();
        this.models();
      }
      this;
    }

    TestEnv.prototype.adapter = function() {
      return Fixture.Adapter = EmberCouchDBKit.DocumentAdapter.extend({
        db: 'doc'
      });
    };

    TestEnv.prototype.store = function() {
      return Fixture.Store = DS.Store.extend({
        adapter: Fixture.Adapter.create()
      });
    };

    TestEnv.prototype.models = function() {
      Fixture.Person = DS.Model.extend({
        name: DS.attr('string'),
        history: DS.belongsTo('Fixture.History')
      });
      Fixture.Comment = DS.Model.extend({
        text: DS.attr('string')
      });
      Fixture.Article = DS.Model.extend({
        label: DS.attr('string'),
        person: DS.belongsTo(Fixture.Person),
        comments: DS.hasMany(Fixture.Comment)
      });
      Fixture.History = DS.Model.extend();
      return Fixture.Store.registerAdapter('Fixture.History', EmberCouchDBKit.RevsAdapter.extend({
        db: 'doc'
      }));
    };

    TestEnv.prototype.create = function(model, params) {
      model = model.createRecord(params);
      runs(function() {
        return model.save();
      });
      waitsFor(function() {
        return model.id !== null;
      }, "Article id should have NOT be null", 3000);
      return model;
    };

    return TestEnv;

  })();

}).call(this);
