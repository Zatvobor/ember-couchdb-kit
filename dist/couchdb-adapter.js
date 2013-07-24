/*
  This object is a simple json based serializer with advanced conviniences for
  managing CouchDB entities.

@namespace DS
@class CouchDBSerializer
@extends DS.JSONSerializer
*/


(function() {
  DS.CouchDBSerializer = DS.JSONSerializer.extend({
    typeAttribute: 'ember_type',
    addEmptyHasMany: false,
    addEmptyBelongsTo: false,
    materialize: function(record, hash) {
      this._super.apply(this, arguments);
      record.materializeAttribute("_rev", hash.rev || hash._rev);
      return record.materializeAttribute("raw", hash);
    },
    serialize: function(record, options) {
      var json;

      json = this._super.apply(this, arguments);
      this.addRevision(json, record, options);
      this.addTypeAttribute(json, record);
      return json;
    },
    extractHasMany: function(type, hash, key) {
      if (key === "attachments" || key === "_attachments") {
        return this.extractAttachments(hash["_attachments"], type.toString(), hash);
      } else {
        return hash[key];
      }
    },
    extractBelongsTo: function(type, hash, key) {
      if (key === "history") {
        return this.extractId(type, hash) + "/history";
      } else {
        return hash[key];
      }
    },
    extract: function(loader, json, type) {
      return this.extractRecordRepresentation(loader, type, json);
    },
    extractAttachments: function(attachments, type, hash) {
      var attachment, k, key, v, _attachments;

      _attachments = [];
      for (k in attachments) {
        v = attachments[k];
        key = "" + hash._id + "/" + k;
        attachment = {
          id: key,
          content_type: v.content_type,
          digest: v.digest,
          length: v.length,
          stub: v.stub,
          doc_id: hash._id,
          _rev: hash._rev,
          file_name: k,
          doc_type: type,
          revpos: v.revpos,
          db: v.db
        };
        AttachmentStore.add(key, attachment);
        _attachments.push(key);
      }
      return _attachments;
    },
    extractId: function(type, hash) {
      return hash._id || hash.id;
    },
    stringForType: function(type) {
      var pattern, reg_array;

      type = type.toString();
      if (type.search(".") < 0) {
        return type;
      } else {
        pattern = /((?:.*))\.(\w+)/ig;
        reg_array = pattern.exec(type);
        return reg_array[reg_array.length - 1].toString().toLowerCase();
      }
    },
    getRecordRevision: function(record) {
      return record.get('_data.attributes._rev');
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
    },
    addTypeAttribute: function(json, record) {
      var typeAttribute;

      if (this.get('add_type_attribute')) {
        typeAttribute = this.get('typeAttribute');
        return json[typeAttribute] = this.stringForType(record.constructor);
      }
    },
    addHasMany: function(data, record, key, relationship) {
      return this._addHasMany(data, record, key, relationship);
    },
    _addHasMany: function(data, record, key, relationship) {
      var attr_key, value, values;

      value = record.get(key);
      attr_key = record.get("" + relationship.key + "_key") || "id";
      if (this.get('addEmptyHasMany') || !Ember.isEmpty(value)) {
        values = value.getEach(attr_key);
        if (values.every(function(value) {
          return !value;
        })) {
          values = record.get('_data.attributes.raw')[key];
          if (values) {
            return data[key] = values;
          }
        } else {
          return data[key] = values;
        }
      }
    },
    addBelongsTo: function(hash, record, key, relationship) {
      var id, id_key;

      if (key === "history") {
        return;
      }
      id_key = record.get("" + relationship.key + "_key") || "id";
      id = Ember.get(record, "" + relationship.key + "." + id_key);
      if (this.get('addEmptyBelongsTo') || !Ember.isEmpty(id)) {
        return hash[key] = id;
      }
    }
  });

  /*
  
    An `CouchDBAdapter` is a main adapter for connecting your models with CouchDB documents.
  
    Let's consider a simple model:
  
      ```
      EmberApp.CouchDBModel = DS.Model.extend
         type: DS.attr('string')
         title: DS.attr('title')
  
      EmberApp.Store.registerAdapter('EmberApp.CouchDBModel', DS.CouchDBAdapter.extend({db: 'my_couchdb'}))
      ```
  
    The following available operations:
  
      ```
        # GET /my_couchdb/:id
        EmberApp.CouchDBModel.find("id")
  
        # POST /my_couchdb
        EmberApp.CouchDBModel.create({type: "my_type", title: "title"})
  
        # PUT /my_couchdb/:id
        model = EmberApp.CouchDBModel.find("id")
        model.set('title', 'new_title')
        model.get('store').commit()
  
        # DELETE /my_couchdb/:id
        model.deleteRecord()
      ```
  
    In additional, the following relations also available for getting and pushing related models:
  
      ```
      EmberApp.Post = DS.Model.extend
         title: DS.attr('string')
  
         # {"owner": "person@example.com"}
         owner:  DS.belongsTo('EmberApp.User', { key: 'owner': true})
         owner_key: 'email'
  
         # {"people":["person1@example.com", "person2@example.com"]}
         people: DS.hasMany('EmberApp.User',   { key: 'people', embedded: true})
         people_key: 'email'
      ```
  
    You can use `find` method for quering design views too:
  
      ```
      EmberApp.Task.find({type: "view", designDoc: 'tasks', viewName: "by_assignee", options: 'include_docs=true&key="%@"'.fmt(@get('email'))})
      # => Ember.Enumerable<EmberApp.Task>
      ```
  
    ## Tip and tricks
  
    Getting a raw document object
  
      ```
      doc = EmberApp.CouchDBModel.find("id")
      raw_json = doc.get('_data.attributes.raw')
      # => Object {_id: "...", _rev: "...", …}
  
    If you wonder about `id` which could be missed in your db then, you should check its `isLoaded` state
  
      ```
      doc = EmberApp.CouchDBModel.find("undefined")
      # GET http://127.0.0:5984/db/undefined 404 (Object Not Found)
      doc.get('isLoaded')
      # => false
      ```
  
  
  @namespace DS
  @class CouchDBAdapter
  @extends DS.Adapter
  */


  DS.CouchDBAdapter = DS.Adapter.extend({
    typeAttribute: 'ember_type',
    typeViewName: 'by-ember-type',
    customTypeLookup: false,
    serializer: DS.CouchDBSerializer,
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
    },
    shouldCommit: function(record, relationships) {
      return this._super.apply(arguments);
    },
    stringForType: function(type) {
      return this.get('serializer').stringForType(type);
    },
    find: function(store, type, id) {
      if (this._checkForRevision(id)) {
        return this.findWithRev(store, type, id);
      } else {
        return this.ajax(id, 'GET', {
          context: this,
          success: function(data) {
            return this.didFindRecord(store, type, data, id);
          }
        });
      }
    },
    findWithRev: function(store, type, id) {
      var _id, _ref, _rev;

      _ref = id.split("/").slice(0, 2), _id = _ref[0], _rev = _ref[1];
      return this.ajax("%@?rev=%@".fmt(_id, _rev), 'GET', {
        context: this,
        success: function(data) {
          return this.didFindRecord(store, type, data, id);
        }
      });
    },
    findManyWithRev: function(store, type, ids) {
      var _this = this;

      return ids.forEach(function(id) {
        return _this.findWithRev(store, type, id);
      });
    },
    findMany: function(store, type, ids) {
      var data;

      if (this._checkForRevision(ids[0])) {
        return this.findManyWithRev(store, type, ids);
      } else {
        data = {
          include_docs: true,
          keys: ids
        };
        return this.ajax('_all_docs?include_docs=true', 'POST', {
          data: data,
          context: this,
          success: function(data) {
            return store.loadMany(type, data.rows.getEach('doc'));
          }
        });
      }
    },
    findQuery: function(store, type, query, modelArray) {
      var designDoc;

      if (query.type === 'view') {
        designDoc = query.designDoc || this.get('designDoc');
        return this.ajax('_design/%@/_view/%@'.fmt(designDoc, query.viewName), 'GET', {
          context: this,
          data: query.options,
          success: function(data) {
            var recordDef;

            recordDef = {};
            recordDef[designDoc] = data.rows.getEach('doc');
            return this.didFindQuery(store, type, recordDef, modelArray);
          }
        });
      }
    },
    findAll: function(store, type) {
      var data, designDoc, params, typeString, typeViewName, viewName;

      designDoc = this.get('designDoc');
      if (this.get('customTypeLookup') && this.viewForType) {
        params = {};
        viewName = this.viewForType(type, params);
        params.include_docs = true;
        return this.ajax('_design/%@/_view/%@'.fmt(designDoc, viewName), 'GET', {
          data: params,
          context: this,
          success: function(data) {
            return store.loadMany(type, data.rows.getEach('doc'));
          }
        });
      } else {
        typeViewName = this.get('typeViewName');
        typeString = this.stringForType(type);
        data = {
          include_docs: true,
          key: encodeURI('"' + typeString + '"')
        };
        return this.ajax('_design/%@/_view/%@'.fmt(designDoc, typeViewName), 'GET', {
          context: this,
          data: data,
          success: function(data) {
            return store.loadMany(type, data.rows.getEach('doc'));
          }
        });
      }
    },
    createRecord: function(store, type, record) {
      var json;

      json = this.serialize(record);
      return this.ajax('', 'POST', {
        data: json,
        context: this,
        success: function(data) {
          return store.didSaveRecord(record, $.extend(json, data));
        }
      });
    },
    updateRecord: function(store, type, record) {
      var json;

      json = this.serialize(record, {
        associations: false,
        includeId: true
      });
      this._updateAttachmnets(record, json);
      return this.ajax(record.get('id'), 'PUT', {
        data: json,
        context: this,
        success: function(data) {
          return store.didSaveRecord(record, $.extend(json, data));
        },
        error: function(xhr, textStatus, errorThrown) {
          if (xhr.status === 409) {
            return store.recordWasInvalid(record, {});
          }
        }
      });
    },
    deleteRecord: function(store, type, record) {
      return this.ajax("%@?rev=%@".fmt(record.get('id'), record.get('_data.attributes._rev')), 'DELETE', {
        context: this,
        success: function(data) {
          return store.didSaveRecord(record);
        }
      });
    },
    _updateAttachmnets: function(record, json) {
      var _attachments;

      if (window.AttachmentStore && record.get('attachments')) {
        _attachments = {};
        record.get('attachments').forEach(function(item) {
          var attachment;

          attachment = AttachmentStore.get(item.get('id'));
          return _attachments[item.get('file_name')] = {
            content_type: attachment.content_type,
            digest: attachment.digest,
            length: attachment.length,
            stub: attachment.stub,
            revpos: attachment.revpos
          };
        });
        json._attachments = _attachments;
        return delete json.attachments;
      }
    },
    _checkForRevision: function(id) {
      return id.split("/").length > 1;
    }
  });

}).call(this);
