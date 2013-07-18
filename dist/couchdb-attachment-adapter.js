/*
  This object is a simple json based serializer with advanced conviniences for
  extracting all document's attachment metadata and prepare them for further extracting.

@namespace DS
@class CouchDBAttachmentSerializer
@extends DS.JSONSerializer
*/


(function() {
  DS.CouchDBAttachmentSerializer = DS.JSONSerializer.extend({
    materialize: function(record, hash) {
      var document, document_class, rev;

      this._super.apply(this, arguments);
      rev = hash._rev || hash.rev;
      document_class = eval("" + hash.doc_type);
      document = document_class.find(hash.doc_id);
      if (document.get('_data.attributes._rev') !== rev) {
        if (this.getIntRevision(document.get('_data.attributes._rev')) < this.getIntRevision(rev)) {
          document.set('_data.attributes._rev', rev);
        }
      }
      return record.materializeAttribute("document", document);
    },
    serialize: function(record, options) {
      return this._super.apply(this, arguments);
    },
    getIntRevision: function(revision) {
      return parseInt(revision.split("-")[0]);
    },
    extract: function(loader, json, type) {
      return this.extractRecordRepresentation(loader, type, json);
    },
    extractId: function(type, hash) {
      return hash._id || hash.id;
    },
    getRecordRevision: function(record) {
      return record.get('_data.attributes.rev');
    },
    addId: function(json, key, id) {
      return json._id = id;
    },
    addRevision: function(json, record, options) {
      var rev;

      if (options && options.includeId) {
        rev = this.getRecordRevision(record);
        if (rev) {
          return json._rev = rev;
        }
      }
    }
  });

  /*
    An `CouchDBAttachmentAdapter` is an object which manages document's attachements and used
    as a main adapter for `Attachment` models.
  
    Let's consider an usual use case:
  
      ```
      App.Task = DS.Model.extend
        title: DS.attr('string')
        attachments: DS.hasMany('App.Attachment', {embedded: true})
  
      App.Store.registerAdapter('App.Task', DS.CouchDBAdapter.extend({db: 'docs'}))
  
      App.Attachment = DS.Model.extend
        content_type: DS.attr('string')
        length: DS.attr('number')
        file_name: DS.attr('string')
        db: DS.attr('string')
  
      App.Store.registerAdapter('App.Attachment', DS.CouchDBAttachmentAdapter.extend({db: 'docs'}))
      ```
  
    So, the `App.Task` model is able to load its attachments as many `App.Attachment` models.
  
      ```
      task = App.Task.find("3bbf4b8c504134dd125e7b603b004b71")
      attachemnts = task.attachments # as an Ember.Enumerable instance
      ```
  
    In short, there is a simple example how to commit `App.Attachment` record
  
      ```
      params = {
        doc_id: doc_id
        doc_type: doc_type
  
        id: attachment_id
        blob_data: blob_data
        rev: doc_rev
        content_type: file_type
        length: file_size
        file_name: name
      }
  
      attachment = TaskEmber.Attachment.createRecord(params)
      attachment.get('store').commit()
      ```
  
  @namespace DS
  @class CouchDBAttachmentAdapter
  @extends DS.Adapter
  */


  DS.CouchDBAttachmentAdapter = DS.Adapter.extend({
    serializer: DS.CouchDBAttachmentSerializer,
    shouldCommit: function(record, relationships) {
      return this._super.apply(arguments);
    },
    find: function(store, type, id) {
      var data;

      data = AttachmentStore.get(id);
      return this.didFindRecord(store, type, data, id);
    },
    findMany: function(store, type, ids) {
      var docs,
        _this = this;

      docs = ids.map(function(item) {
        item = AttachmentStore.get(item);
        item.db = _this.get('db');
        return item;
      });
      return store.loadMany(type, docs);
    },
    createRecord: function(store, type, record) {
      var path, request,
        _this = this;

      request = new XMLHttpRequest();
      path = "/%@/%@?rev=%@".fmt(this.get('db'), record.get('id'), record.get('rev'));
      request.open('PUT', path, true);
      request.setRequestHeader('Content-Type', record.get('content_type'));
      request.send(record.get('blob_data'));
      return request.onreadystatechange = function() {
        var data, json;

        if (request.readyState === 4 && (request.status === 201 || request.status === 200)) {
          data = JSON.parse(request.response);
          data.doc_type = record.get('doc_type');
          data.doc_id = record.get('doc_id');
          json = _this.serialize(record, {
            includeId: true
          });
          return store.didSaveRecord(record, $.extend(json, data));
        }
      };
    },
    updateRecord: function(store, type, record) {},
    deleteRecord: function(store, type, record) {}
  });

  this.AttachmentStore = (function() {
    function AttachmentStore() {}

    AttachmentStore.attachments = {};

    AttachmentStore.add = function(key, value) {
      return this.attachments[key] = value;
    };

    AttachmentStore.get = function(key) {
      return this.attachments[key];
    };

    AttachmentStore.remove = function() {
      return this.attachments[key] = void 0;
    };

    return AttachmentStore;

  })();

}).call(this);
