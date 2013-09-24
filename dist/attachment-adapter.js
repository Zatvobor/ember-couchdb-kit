/*
@namespace EmberCouchDBKit
@class AttachmentSerializer
@extends DS.RESTSerializer
*/


(function() {
  EmberCouchDBKit.AttachmentSerializer = DS.RESTSerializer.extend({
    primaryKey: 'id',
    normalize: function(type, hash) {
      var rev, self;
      self = this;
      rev = hash._rev || hash.rev;
      this.store.find(hash.model_name, hash.doc_id).then(function(document) {
        if (document.get('_data.rev') !== rev) {
          if (self.getIntRevision(document.get('_data.rev')) < self.getIntRevision(rev)) {
            return document.set('_data.rev', rev);
          }
        }
      });
      return this._super(type, hash);
    },
    getIntRevision: function(revision) {
      return parseInt(revision.split("-")[0]);
    },
    normalizeId: function(hash) {
      return hash.id = hash["_id"] || hash["id"];
    }
  });

  /*
    An `AttachmentAdapter` is an object which manages document's attachements and used
    as a main adapter for `Attachment` enabled models.
  
    Let's consider an usual use case:
      ```coffee
      App.Task = DS.Model.extend
        title: DS.attr('string')
        attachments: DS.hasMany('attachment', {async: true})
  
      App.Attachment = DS.Model.extend
        content_type: DS.attr('string')
        length: DS.attr('number')
        file_name: DS.attr('string')
        db: DS.attr('string')
  
      task = @get('store').find('task', id)
      attachments = task.get('attachments')
      ```
  
      For getting more details check `spec/coffeescripts/attachment-adapter_spec.coffee` file.
  
  @namespace EmberCouchDBKit
  @class AttachmentAdapter
  @extends DS.Adapter
  */


  EmberCouchDBKit.AttachmentAdapter = DS.Adapter.extend({
    find: function(store, type, id) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        return Ember.run(null, resolve, {
          attachment: EmberCouchDBKit.AttachmentStore.get(id)
        });
      });
    },
    findMany: function(store, type, ids) {
      var docs,
        _this = this;
      docs = ids.map(function(item) {
        item = EmberCouchDBKit.AttachmentStore.get(item);
        item.db = _this.get('db');
        return item;
      });
      return new Ember.RSVP.Promise(function(resolve, reject) {
        return Ember.run(null, resolve, {
          attachments: docs
        });
      });
    },
    createRecord: function(store, type, record) {
      var adapter, url;
      url = "%@/%@?rev=%@".fmt(this.buildURL(), record.get('id'), record.get('rev'));
      adapter = this;
      return new Ember.RSVP.Promise(function(resolve, reject) {
        var data, request,
          _this = this;
        data = {};
        data.context = adapter;
        request = new XMLHttpRequest();
        request.open('PUT', url, true);
        request.setRequestHeader('Content-Type', record.get('content_type'));
        adapter._updateUploadState(record, request);
        request.onreadystatechange = function() {
          var json;
          if (request.readyState === 4 && (request.status === 201 || request.status === 200)) {
            data = JSON.parse(request.response);
            data.model_name = record.get('model_name');
            data.doc_id = record.get('doc_id');
            json = adapter.serialize(record, {
              includeId: true
            });
            delete data.id;
            return Ember.run(null, resolve, {
              attachment: $.extend(json, data)
            });
          }
        };
        return request.send(record.get('file'));
      });
    },
    updateRecord: function(store, type, record) {},
    deleteRecord: function(store, type, record) {
      return new Ember.RSVP.Promise(function(resolve, reject) {
        return Ember.run(null, resolve, {});
      });
    },
    _updateUploadState: function(record, request) {
      var view,
        _this = this;
      view = record.get('view');
      if (view) {
        view.startUpload();
        return request.onprogress = function(oEvent) {
          var percentComplete;
          if (oEvent.lengthComputable) {
            percentComplete = (oEvent.loaded / oEvent.total) * 100;
            return view.updateUpload(percentComplete);
          }
        };
      }
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
