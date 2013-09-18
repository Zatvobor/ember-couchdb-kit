/*
@namespace EmberCouchDBKit
@class DocumentSerializer
@extends DS.RESTSerializer.extend
*/


(function() {
  EmberCouchDBKit.DocumentSerializer = DS.RESTSerializer.extend({
    primaryKey: '_id',
    normalize: function(type, hash, prop) {
      this.normalizeId(hash);
      this.normalizeAttachments(hash["_attachments"], type.typeKey, hash);
      this.addHistoryId(hash);
      this.normalizeUsingDeclaredMapping(type, hash);
      this.normalizeAttributes(type, hash);
      this.normalizeRelationships(type, hash);
      if (this.normalizeHash && this.normalizeHash[prop]) {
        return this.normalizeHash[prop](hash);
      }
      if (!hash) {
        return hash;
      }
      this.applyTransforms(type, hash);
      return hash;
    },
    extractSingle: function(store, type, payload, id, requestType) {
      return this._super(store, type, payload, id, requestType);
    },
    serialize: function(record, options) {
      return this._super(record, options);
    },
    addHistoryId: function(hash) {
      return hash.history = "%@/history".fmt(hash.id);
    },
    normalizeAttachments: function(attachments, type, hash) {
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
          rev: hash.rev,
          file_name: k,
          model_name: type,
          revpos: v.revpos,
          db: v.db
        };
        EmberCouchDBKit.AttachmentStore.add(key, attachment);
        _attachments.push(key);
      }
      return hash.attachments = _attachments;
    },
    normalizeId: function(hash) {
      return hash.id = hash["_id"] || hash["id"];
    },
    serializeBelongsTo: function(record, json, relationship) {
      var attribute, belongsTo, key;
      attribute = relationship.options.attribute || "id";
      key = relationship.key;
      belongsTo = Ember.get(record, key);
      if (Ember.isNone(belongsTo)) {
        return;
      }
      json[key] = Ember.get(belongsTo, attribute);
      if (relationship.options.polymorphic) {
        return json[key + "_type"] = belongsTo.constructor.typeKey;
      }
    },
    serializeHasMany: function(record, json, relationship) {
      var attribute, key, relationshipType;
      attribute = relationship.options.attribute || "id";
      key = relationship.key;
      relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);
      if (relationshipType === "manyToNone" || relationshipType === "manyToMany") {
        return json[key] = Ember.get(record, key).mapBy(attribute);
      }
    }
  });

  /*
  
    A `DocumentAdapter` should be used as a main adapter for working with models as a CouchDB documents.
  
    Let's consider:
  
      ```coffee
      EmberApp.DocumentAdapter = EmberCouchDBKit.DocumentAdapter.extend({db: db, host: host})
      EmberApp.DocumentSerializer = EmberCouchDBKit.DocumentSerializer.extend()
  
      EmberApp.Document = DS.Model.extend
        title: DS.attr('title')
        type: DS.attr('string', {defaultValue: 'document'})
      ```
  
    The following available operations:
  
      ```coffee
        # GET /my_couchdb/:id
        @get('store').find('document', id)
  
        # POST /my_couchdb
        @get('store').createRecord('document', {title: "title"}).save()
  
        # update PUT /my_couchdb/:id
        @get('store').find('document', id).then((document) ->
          document.set('title', title)
          document.save()
        )
  
        # DELETE /my_couchdb/:id
        @get('store').find('document', id).deleteRecord().save()
      ```
  
    For more advanced tips and tricks, you should check available specs
  
  @namespace EmberCouchDBKit
  @class DocumentAdapter
  @extends DS.Adapter
  */


  EmberCouchDBKit.DocumentAdapter = DS.Adapter.extend({
    customTypeLookup: false,
    is: function(status, h) {
      if (this.head(h["for"]).status === status) {
        return true;
      }
    },
    head: function(h) {
      var docId;
      docId = typeof h === "object" ? h.get('id') : h;
      return this.ajax(docId, 'HEAD', {
        async: false
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
    },
    ajax: function(url, type, normalizeResponce, hash) {
      return this._ajax('%@/%@'.fmt(this.buildURL(), url || ''), type, normalizeResponce, hash);
    },
    _ajax: function(url, type, normalizeResponce, hash) {
      var adapter;
      if (hash == null) {
        hash = {};
      }
      adapter = this;
      return new Ember.RSVP.Promise(function(resolve, reject) {
        var headers;
        if (url.split("/").pop() === "") {
          url = url.substr(0, url.length - 1);
        }
        hash.url = url;
        hash.type = type;
        hash.dataType = 'json';
        hash.contentType = 'application/json; charset=utf-8';
        hash.context = adapter;
        if (hash.data && type !== 'GET') {
          hash.data = JSON.stringify(hash.data);
        }
        if (adapter.headers) {
          headers = adapter.headers;
          hash.beforeSend = function(xhr) {
            return forEach.call(Ember.keys(headers), function(key) {
              return xhr.setRequestHeader(key, headers[key]);
            });
          };
        }
        if (!hash.success) {
          hash.success = function(json) {
            var _modelJson;
            _modelJson = normalizeResponce.call(adapter, json);
            return Ember.run(null, resolve, _modelJson);
          };
        }
        hash.error = function(jqXHR, textStatus, errorThrown) {
          if (jqXHR) {
            jqXHR.then = null;
          }
          return Ember.run(null, reject, jqXHR);
        };
        return Ember.$.ajax(hash);
      });
    },
    _normalizeRevision: function(json) {
      if (json._rev) {
        json.rev = json._rev;
        delete json._rev;
      }
      return json;
    },
    shouldCommit: function(record, relationships) {
      return this._super.apply(arguments);
    },
    stringForType: function(type) {
      return this.get('serializer').stringForType(type);
    },
    find: function(store, type, id) {
      var normalizeResponce;
      if (this._checkForRevision(id)) {
        this.findWithRev(store, type, id);
      } else {
        normalizeResponce = function(data) {
          var _modelJson;
          this._normalizeRevision(data);
          _modelJson = {};
          _modelJson[type.typeKey] = data;
          return _modelJson;
        };
      }
      return this.ajax(id, 'GET', normalizeResponce);
    },
    findWithRev: function(store, type, id) {
      var normalizeResponce, _id, _ref, _rev;
      _ref = id.split("/").slice(0, 2), _id = _ref[0], _rev = _ref[1];
      normalizeResponce = function(data) {
        var _modelJson;
        this._normalizeRevision(data);
        _modelJson = {};
        _modelJson[type.typeKey] = data;
        return _modelJson;
      };
      return this.ajax("%@?rev=%@".fmt(_id, _rev), 'GET', normalizeResponce);
    },
    findManyWithRev: function(store, type, ids) {
      var _this = this;
      return ids.forEach(function(id) {
        return _this.findWithRev(store, type, id);
      });
    },
    findMany: function(store, type, ids) {
      var data, normalizeResponce;
      if (this._checkForRevision(ids[0])) {
        return this.findManyWithRev(store, type, ids);
      } else {
        data = {
          include_docs: true,
          keys: ids
        };
        normalizeResponce = function(data) {
          var json,
            _this = this;
          json = {};
          json[Ember.String.pluralize(type.typeKey)] = data.rows.getEach('doc').map(function(doc) {
            return _this._normalizeRevision(doc);
          });
          return json;
        };
        return this.ajax('_all_docs?include_docs=true', 'POST', normalizeResponce, {
          data: data
        });
      }
    },
    findQuery: function(store, type, query, modelArray) {
      var designDoc, normalizeResponce;
      if (query.type === 'view') {
        designDoc = query.designDoc || this.get('designDoc');
        normalizeResponce = function(data) {
          var json,
            _this = this;
          json = {};
          json[designDoc] = data.rows.getEach('doc').map(function(doc) {
            return _this._normalizeRevision(doc);
          });
          return json;
        };
        return this.ajax('_design/%@/_view/%@'.fmt(designDoc, query.viewName), 'GET', normalizeResponce, {
          context: this,
          data: query.options
        });
      }
    },
    findAll: function(store, type) {
      var data, designDoc, normalizeResponce, params, typeString, typeViewName, viewName;
      designDoc = this.get('designDoc');
      normalizeResponce = function(data) {
        var json,
          _this = this;
        json = {};
        json[[Ember.String.pluralize(type.typeKey)]] = data.rows.getEach('doc').map(function(doc) {
          return _this._normalizeRevision(doc);
        });
        return json;
      };
      if (this.get('customTypeLookup') && this.viewForType) {
        params = {};
        viewName = this.viewForType(type, params);
        params.include_docs = true;
        return this.ajax('_design/%@/_view/%@'.fmt(designDoc, viewName), 'GET', normalizeResponce, {
          data: params
        });
      } else {
        typeViewName = this.get('typeViewName');
        typeString = this.stringForType(type);
        data = {
          include_docs: true,
          key: '"' + typeString + '"'
        };
        return this.ajax('_design/%@/_view/%@'.fmt(designDoc, typeViewName), 'GET', normalizeResponce, {
          data: data
        });
      }
    },
    createRecord: function(store, type, record) {
      var json;
      json = store.serializerFor(type.typeKey).serialize(record);
      return this._push(store, type, record, json);
    },
    updateRecord: function(store, type, record) {
      var json;
      json = this.serialize(record, {
        associations: true,
        includeId: true
      });
      if (record.get('attachments')) {
        this._updateAttachmnets(record, json);
      }
      return this._push(store, type, record, json);
    },
    deleteRecord: function(store, type, record) {
      return this.ajax("%@?rev=%@".fmt(record.get('id'), record.get('_data.rev')), 'DELETE', (function() {}), {});
    },
    _updateAttachmnets: function(record, json) {
      var _attachments;
      _attachments = {};
      record.get('attachments').forEach(function(item) {
        var attachment;
        attachment = EmberCouchDBKit.AttachmentStore.get(item.get('id'));
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
    },
    _checkForRevision: function(id) {
      (id != null ? id.split("/").length : void 0) > 1;
      return id.split("/").length > 1;
    },
    _push: function(store, type, record, json) {
      var id, method, normalizeResponce;
      id = record.get('id') || '';
      method = record.get('id') ? 'PUT' : 'POST';
      if (record.get('_data.rev')) {
        json._rev = record.get('_data.rev');
      }
      normalizeResponce = function(data) {
        var _data, _modelJson;
        _data = json || {};
        this._normalizeRevision(data);
        _modelJson = {};
        _modelJson[type.typeKey] = $.extend(_data, data);
        return _modelJson;
      };
      return this.ajax(id, method, normalizeResponce, {
        data: json
      });
    }
  });

}).call(this);
