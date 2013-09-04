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
        window.App = Ember.Application.create({
          rootElement: "body"
        });
        window.Fixture = window.App;
        this.adapter();
        this.store();
        this.models();
      }
      this;
    }

    TestEnv.prototype.adapter = function() {
      return App.Adapter = EmberCouchDBKit.DocumentAdapter.extend({
        db: 'doc'
      });
    };

    TestEnv.prototype.store = function() {
      return App.Store = DS.Store.extend({
        adapter: App.Adapter.create()
      });
    };

    TestEnv.prototype.models = function() {
      App.Person = DS.Model.extend({
        name: DS.attr('string'),
        history: DS.belongsTo('App.History')
      });
      App.Comment = DS.Model.extend({
        text: DS.attr('string')
      });
      App.Article = DS.Model.extend({
        label: DS.attr('string'),
        person: DS.belongsTo(App.Person),
        comments: DS.hasMany(App.Comment)
      });
      App.History = DS.Model.extend();
      return App.Store.registerAdapter('App.History', EmberCouchDBKit.RevsAdapter.extend({
        db: 'doc'
      }));
    };

    TestEnv.prototype.create = function(model, params) {
      return TestEnv.createAbstract(model.createRecord(params));
    };

    TestEnv.prototype.createPerson = function(params) {
      return TestEmberApp.createAbstract(App.Person.createRecord(params));
    };

    TestEnv.prototype.createArticle = function(params) {
      return TestEmberApp.createAbstract(App.Article.createRecord(params));
    };

    TestEnv.prototype.createMessage = function(params) {
      return TestEmberApp.createAbstract(App.Message.createRecord(params));
    };

    TestEnv.prototype.createComment = function(params) {
      return TestEmberApp.createAbstract(App.Comment.createRecord(params));
    };

    TestEnv.createAbstract = function(model) {
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
