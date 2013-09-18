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
      var mapping;
      DatabaseCleaner.reset();
      if (!window.Fixture) {
        this.models();
        mapping = {
          user: User,
          article: Article,
          comment: Comment,
          message: Message,
          history: History
        };
        window.Fixture = window.setupStore(mapping);
      }
      this;
    }

    TestEnv.prototype.models = function() {
      window.User = DS.Model.extend({
        name: DS.attr('string'),
        history: DS.belongsTo('history')
      });
      window.Comment = DS.Model.extend({
        text: DS.attr('string')
      });
      window.Article = DS.Model.extend({
        label: DS.attr('string'),
        user: DS.belongsTo('user', {
          inverse: null
        }),
        comments: DS.hasMany('comment', {
          async: true,
          inverse: null
        })
      });
      window.Message = DS.Model.extend({
        user: DS.belongsTo('user', {
          attribute: "name"
        })
      });
      return window.History = DS.Model.extend();
    };

    TestEnv.prototype.create = function(type, params) {
      var model;
      model = window.Fixture.store.createRecord(type, params);
      runs(function() {
        return model.save();
      });
      waitsFor(function() {
        return model.get('_data.rev') !== void 0;
      }, "model should be saved", 3000);
      return model;
    };

    return TestEnv;

  })();

  window.setupStore = function(options) {
    var adapter, container, env, prop;
    env = {};
    options = options || {};
    container = env.container = new Ember.Container();
    adapter = env.adapter = EmberCouchDBKit.DocumentAdapter.extend({
      db: 'doc'
    });
    delete options.adapter;
    for (prop in options) {
      container.register("model:" + prop, options[prop]);
    }
    container.register("store:main", DS.Store.extend({
      adapter: adapter
    }));
    container.register("serializer:_default", EmberCouchDBKit.DocumentSerializer);
    container.register("serializer:_couch", EmberCouchDBKit.DocumentSerializer);
    container.register("serializer:_rest", DS.RESTSerializer);
    container.register("serializer:history", EmberCouchDBKit.RevSerializer);
    container.register("adapter:_rest", DS.RESTAdapter);
    container.register("adapter:history", EmberCouchDBKit.RevAdapter);
    container.register('transform:boolean', DS.BooleanTransform);
    container.register('transform:date', DS.DateTransform);
    container.register('transform:number', DS.NumberTransform);
    container.register('transform:string', DS.StringTransform);
    container.injection("serializer", "store", "store:main");
    env.serializer = container.lookup("serializer:_default");
    env.restSerializer = container.lookup("serializer:_rest");
    env.store = container.lookup("store:main");
    env.adapter = env.store.get("defaultAdapter");
    return env;
  };

}).call(this);
