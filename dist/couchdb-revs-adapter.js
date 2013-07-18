/*
  This object is a simple json based serializer with advanced `extractHasMany` convinience for
  extracting all document's revisions and prepare them for further loading.

@namespace DS
@class CouchDBRevsSerializer
@extends DS.JSONSerializer
*/


(function() {
  DS.CouchDBRevsSerializer = DS.JSONSerializer.extend({
    materialize: function(record, hash) {
      return this._super.apply(this, arguments);
    },
    serialize: function(record, options) {
      return this._super.apply(this, arguments);
    },
    extract: function(loader, json, type) {
      return this.extractRecordRepresentation(loader, type, json);
    },
    extractId: function(type, hash) {
      return hash._id || hash.id;
    },
    addId: function(json, key, id) {
      return json._id = id;
    },
    extractHasMany: function(type, hash, key) {
      return hash[key] = RevsStore.mapRevIds(this.extractId(type, hash));
    },
    extractBelongsTo: function(type, hash, key) {
      if (key.match("prev_")) {
        return hash[key] = RevsStore.mapRevIds(this.extractId(type, hash))[1];
      }
    }
  });

  /*
    An `CouchDBRevsAdapter` is an object which gets revisions info by distinct document and used
    as a main adapter for `Revision` models.
  
    Let's consider an usual use case:
  
      ```
      App.Task = DS.Model.extend
        title: DS.attr('string')
        history: DS.belongsTo('App.History')
  
      App.Store.registerAdapter('App.Task', DS.CouchDBAdapter.extend({db: 'docs'}))
  
      App.History = DS.Model.extend
        tasks: DS.hasMany('App.Task', {key: "tasks", embedded: true})
        prev_task: DS.belongsTo('App.Task', {key: "prev_task", embedded: true})
  
  
      App.Store.registerAdapter('App.History', DS.CouchDBRevsAdapter.extend({db: 'docs'}))
      ```
  
    So, the `App.Task` model is able to load its revisions as a regular `App.Task` models.
  
      ```
      task = App.Task.find("3bbf4b8c504134dd125e7b603b004b71")
  
      revs_tasks = task.history.tasks
      # => Ember.Enumerable<App.Task>
      ```
  
  @namespace DS
  @class CouchDBRevsAdapter
  @extends DS.Adapter
  */


  DS.CouchDBRevsAdapter = DS.Adapter.extend({
    serializer: DS.CouchDBRevsSerializer,
    shouldCommit: function(record, relationships) {
      return this._super.apply(arguments);
    },
    find: function(store, type, id) {
      return this.ajax("%@?revs_info=true".fmt(id.split("/")[0]), 'GET', {
        context: this,
        success: function(data) {
          RevsStore.add(id, data);
          return this.didFindRecord(store, type, {
            _id: id
          }, id);
        }
      });
    },
    updateRecord: function(store, type, record) {},
    deleteRecord: function(store, type, record) {},
    ajax: function(url, type, hash) {
      return this._ajax('/%@/%@'.fmt(this.get('db'), url || ''), type, hash);
    },
    _ajax: function(url, type, hash) {
      if (url.split("/").pop() === "") {
        url = url.substr(0, url.length - 1);
      }
      hash.url = url;
      hash.type = type;
      hash.dataType = 'json';
      hash.contentType = 'application/json; charset=utf-8';
      hash.context = this;
      if (hash.data && type !== 'GET') {
        hash.data = JSON.stringify(hash.data);
      }
      return Ember.$.ajax(hash);
    }
  });

  this.RevsStore = (function() {
    function RevsStore() {}

    RevsStore.registiry = {};

    RevsStore.add = function(key, value) {
      return this.registiry[key] = value;
    };

    RevsStore.get = function(key) {
      return this.registiry[key];
    };

    RevsStore.remove = function() {
      return this.registiry[key] = void 0;
    };

    RevsStore.mapRevIds = function(key) {
      var _this = this;

      return this.get(key)._revs_info.map(function(_rev) {
        return "%@/%@".fmt(_this.get(key)._id, _rev.rev);
      });
    };

    return RevsStore;

  })();

}).call(this);
