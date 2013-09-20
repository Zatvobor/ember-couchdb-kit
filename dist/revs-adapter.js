/*
@namespace EmberCouchDBKit 
@class RevSerializer
@extends DS.RESTSerializer
*/


(function() {
  EmberCouchDBKit.RevSerializer = DS.RESTSerializer.extend({
    primaryKey: 'id',
    normalize: function(type, hash, prop) {
      this.normalizeRelationships(type, hash);
      return this._super(type, hash, prop);
    },
    extractId: function(type, hash) {
      return hash._id || hash.id;
    },
    normalizeRelationships: function(type, hash) {
      return type.eachRelationship((function(key, relationship) {
        if (relationship.kind === "belongsTo") {
          return hash[key] = EmberCouchDBKit.RevsStore.mapRevIds(this.extractId(type, hash))[1];
        }
      }), this);
    }
  });

  /*
    An `RevAdapter` is an object which gets revisions info by distinct document and used
    as a main adapter for `Revision` models. Works only with belongsTo
  
    Let's consider an usual use case:
    TODO update example snippets
      ```
      App.Task = DS.Model.extend
        title: DS.attr('string')
        history: DS.belongsTo('App.History')
  
  
      App.History = DS.Model.extend
        prev_task: DS.belongsTo('App.Task', {key: "prev_task", embedded: true})
  
  
      ```
  
    So, the `App.Task` model is able to load its revisions as a regular `App.Task` models.
  
      ```
      task = App.Task.find("3bbf4b8c504134dd125e7b603b004b71")
  
      revs_tasks = task.history.tasks
      # => Ember.Enumerable<App.Task>
      ```
  
  @namespace EmberCouchDBKit
  @class RevAdapter
  @extends DS.Adapter
  */


  EmberCouchDBKit.RevAdapter = DS.Adapter.extend({
    find: function(store, type, id) {
      return this.ajax("%@?revs_info=true".fmt(id.split("/")[0]), 'GET', {
        context: this
      }, id);
    },
    updateRecord: function(store, type, record) {},
    deleteRecord: function(store, type, record) {},
    ajax: function(url, type, hash, id) {
      return this._ajax('%@/%@'.fmt(this.buildURL(), url || ''), type, hash, id);
    },
    _ajax: function(url, type, hash, id) {
      hash.url = url;
      hash.type = type;
      hash.dataType = 'json';
      hash.contentType = 'application/json; charset=utf-8';
      hash.context = this;
      if (hash.data && type !== 'GET') {
        hash.data = JSON.stringify(hash.data);
      }
      return new Ember.RSVP.Promise(function(resolve, reject) {
        hash.success = function(data) {
          EmberCouchDBKit.RevsStore.add(id, data);
          return Ember.run(null, resolve, {
            history: {
              id: id
            }
          });
        };
        return Ember.$.ajax(hash);
      });
    },
    buildURL: function() {
      var host, namespace, url;
      host = Ember.get(this, "host");
      namespace = Ember.get(this, "namespace");
      url = [];
      if (host) {
        url.push(host);
      }
      if (namespace) {
        url.push(namespace);
      }
      url.push(this.get('db'));
      url = url.join("/");
      if (!host) {
        url = "/" + url;
      }
      return url;
    }
  });

}).call(this);
