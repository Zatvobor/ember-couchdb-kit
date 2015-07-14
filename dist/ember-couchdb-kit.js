(function() {
  window.EmberCouchDBKit = Ember.Namespace.create({
    VERSION: '1.0.x'
  });

  EmberCouchDBKit.sharedStore = (function() {
    var _data;
    _data = {};
    return {
      add: function(type, key, value) {
        return _data[type + ':' + key] = value;
      },
      get: function(type, key) {
        return _data[type + ':' + key];
      },
      remove: function(type, key) {
        return delete _data[type + ':' + key];
      },
      mapRevIds: function(type, key) {
        var _this = this;
        return this.get(type, key)._revs_info.map(function(_rev) {
          return "%@/%@".fmt(_this.get(type, key)._id, _rev.rev);
        });
      },
      stopAll: function() {
        var k, v, _results;
        _results = [];
        for (k in _data) {
          v = _data[k];
          if (k.indexOf('changes_worker') === 0) {
            _results.push(v.stop());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };
  })();

}).call(this);
;/*
@namespace EmberCouchDBKit
@class DocumentSerializer
@extends DS.RESTSerializer
*/


(function() {
  EmberCouchDBKit.DocumentSerializer = DS.RESTSerializer.extend({
    primaryKey: '_id',
    normalize: function(type, hash, prop) {
      this.normalizeId(hash);
      this.normalizeAttachments(hash["_attachments"], type.modelName, hash);
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
    extractMeta: function(store, type, payload) {
      if (payload && payload.total_rows) {
        store.setMetadataFor(type, {
          total_rows: payload.total_rows
        });
        delete payload.total_rows;
      }
    },
    serialize: function(snapshot, options) {
      return this._super(snapshot, options);
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
        EmberCouchDBKit.sharedStore.add('attachment', key, attachment);
        _attachments.push(key);
      }
      return hash.attachments = _attachments;
    },
    normalizeId: function(hash) {
      return hash.id = hash["_id"] || hash["id"];
    },
    normalizeRelationships: function(type, hash) {
      var key, payloadKey;
      payloadKey = void 0;
      key = void 0;
      if (this.keyForRelationship) {
        return type.eachRelationship((function(key, relationship) {
          payloadKey = this.keyForRelationship(key, relationship.kind);
          if (key === payloadKey) {
            return;
          }
          hash[key] = hash[payloadKey];
          return delete hash[payloadKey];
        }), this);
      }
    },
    serializeBelongsTo: function(snapshot, json, relationship) {
      var attribute, belongsTo, key;
      attribute = relationship.options.attribute || "id";
      key = relationship.key;
      belongsTo = snapshot.belongsTo(key);
      if (Ember.isNone(belongsTo)) {
        return;
      }
      json[key] = attribute === "id" ? belongsTo.id : belongsTo.attr(attribute);
      if (relationship.options.polymorphic) {
        return json[key + "_type"] = belongsTo.modelName;
      }
    },
    serializeHasMany: function(snapshot, json, relationship) {
      var attribute, key, relationshipType;
      attribute = relationship.options.attribute || "id";
      key = relationship.key;
      relationshipType = snapshot.type.determineRelationshipType(relationship);
      switch (relationshipType) {
        case "manyToNone":
        case "manyToMany":
        case "manyToOne":
          return json[key] = snapshot.hasMany(key).mapBy(attribute);
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
    defaultSerializer: '_default',
    customTypeLookup: false,
    typeViewName: "all",
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
    ajax: function(url, type, normalizeResponse, hash) {
      return this._ajax('%@/%@'.fmt(this.buildURL(), url || ''), type, normalizeResponse, hash);
    },
    _ajax: function(url, type, normalizeResponse, hash) {
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
            return Ember.keys(headers).forEach(function(key) {
              return xhr.setRequestHeader(key, headers[key]);
            });
          };
        }
        if (!hash.success) {
          hash.success = function(json) {
            var _modelJson;
            _modelJson = normalizeResponse.call(adapter, json);
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
      if (json && json._rev) {
        json.rev = json._rev;
        delete json._rev;
      }
      return json;
    },
    shouldCommit: function(snapshot, relationships) {
      return this._super.apply(arguments);
    },
    find: function(store, type, id) {
      var normalizeResponse;
      if (this._checkForRevision(id)) {
        return this.findWithRev(store, type, id);
      } else {
        normalizeResponse = function(data) {
          var _modelJson;
          this._normalizeRevision(data);
          _modelJson = {};
          _modelJson[type.modelName] = data;
          return _modelJson;
        };
        return this.ajax(id, 'GET', normalizeResponse);
      }
    },
    findWithRev: function(store, type, id, hash) {
      var normalizeResponse, url, _id, _ref, _rev;
      _ref = id.split("/").slice(0, 2), _id = _ref[0], _rev = _ref[1];
      url = "%@?rev=%@".fmt(_id, _rev);
      normalizeResponse = function(data) {
        var _modelJson;
        this._normalizeRevision(data);
        _modelJson = {};
        data._id = id;
        _modelJson[type.modelName] = data;
        return _modelJson;
      };
      return this.ajax(url, 'GET', normalizeResponse, hash);
    },
    findManyWithRev: function(store, type, ids) {
      var docs, hash, key, self,
        _this = this;
      key = Ember.String.pluralize(type.modelName);
      self = this;
      docs = {};
      docs[key] = [];
      hash = {
        async: false
      };
      ids.forEach(function(id) {
        var url, _id, _ref, _rev;
        _ref = id.split("/").slice(0, 2), _id = _ref[0], _rev = _ref[1];
        url = "%@?rev=%@".fmt(_id, _rev);
        url = '%@/%@'.fmt(_this.buildURL(), url);
        hash.url = url;
        hash.type = 'GET';
        hash.dataType = 'json';
        hash.contentType = 'application/json; charset=utf-8';
        hash.success = function(json) {
          json._id = id;
          self._normalizeRevision(json);
          return docs[key].push(json);
        };
        return Ember.$.ajax(hash);
      });
      return docs;
    },
    findMany: function(store, type, ids) {
      var data, normalizeResponse;
      if (this._checkForRevision(ids[0])) {
        return this.findManyWithRev(store, type, ids);
      } else {
        data = {
          include_docs: true,
          keys: ids
        };
        normalizeResponse = function(data) {
          var json,
            _this = this;
          json = {};
          json[Ember.String.pluralize(type.modelName)] = data.rows.getEach('doc').map(function(doc) {
            return _this._normalizeRevision(doc);
          });
          return json;
        };
        return this.ajax('_all_docs?include_docs=true', 'POST', normalizeResponse, {
          data: data
        });
      }
    },
    findQuery: function(store, type, query, modelArray) {
      var designDoc, normalizeResponse;
      designDoc = query.designDoc || this.get('designDoc');
      if (!query.options) {
        query.options = {};
      }
      query.options.include_docs = true;
      normalizeResponse = function(data) {
        var json,
          _this = this;
        json = {};
        json[designDoc] = data.rows.getEach('doc').map(function(doc) {
          return _this._normalizeRevision(doc);
        });
        json['total_rows'] = data.total_rows;
        return json;
      };
      return this.ajax('_design/%@/_view/%@'.fmt(designDoc, query.viewName), 'GET', normalizeResponse, {
        context: this,
        data: query.options
      });
    },
    findAll: function(store, type) {
      var data, designDoc, normalizeResponse, typeString, typeViewName;
      typeString = Ember.String.singularize(type.modelName);
      designDoc = this.get('designDoc') || typeString;
      typeViewName = this.get('typeViewName');
      normalizeResponse = function(data) {
        var json,
          _this = this;
        json = {};
        json[[Ember.String.pluralize(type.modelName)]] = data.rows.getEach('doc').map(function(doc) {
          return _this._normalizeRevision(doc);
        });
        return json;
      };
      data = {
        include_docs: true,
        key: '"' + typeString + '"'
      };
      return this.ajax('_design/%@/_view/%@'.fmt(designDoc, typeViewName), 'GET', normalizeResponse, {
        data: data
      });
    },
    createRecord: function(store, type, snapshot) {
      var json;
      json = store.serializerFor(type.modelName).serialize(snapshot);
      delete json.rev;
      return this._push(store, type, snapshot, json);
    },
    updateRecord: function(store, type, snapshot) {
      var json;
      json = this.serialize(snapshot, {
        associations: true,
        includeId: true
      });
      if ('attachments' in snapshot.record._data) {
        this._updateAttachmnets(snapshot, json);
      }
      delete json.rev;
      return this._push(store, type, snapshot, json);
    },
    deleteRecord: function(store, type, snapshot) {
      return this.ajax("%@?rev=%@".fmt(snapshot.id, snapshot.attr('rev')), 'DELETE', (function() {}), {});
    },
    _updateAttachmnets: function(snapshot, json) {
      var _attachments;
      _attachments = {};
      snapshot._hasManyRelationships.attachments.forEach(function(item) {
        var attachment;
        attachment = EmberCouchDBKit.sharedStore.get('attachment', item.get('id'));
        return _attachments[attachment.file_name] = {
          content_type: attachment.content_type,
          digest: attachment.digest,
          length: attachment.length,
          stub: attachment.stub,
          revpos: attachment.revpos
        };
      });
      json._attachments = _attachments;
      delete json.attachments;
      return delete json.history;
    },
    _checkForRevision: function(id) {
      return id.split("/").length > 1;
    },
    _push: function(store, type, snapshot, json) {
      var id, method, normalizeResponse;
      id = snapshot.id || '';
      method = snapshot.id ? 'PUT' : 'POST';
      if (snapshot.attr('rev')) {
        json._rev = snapshot.attr('rev');
      }
      normalizeResponse = function(data) {
        var _data, _modelJson;
        _data = json || {};
        this._normalizeRevision(data);
        _modelJson = {};
        _modelJson[type.modelName] = $.extend(_data, data);
        return _modelJson;
      };
      return this.ajax(id, method, normalizeResponse, {
        data: json
      });
    }
  });

}).call(this);
;/*
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
          attachment: EmberCouchDBKit.sharedStore.get('attachment', id)
        });
      });
    },
    findMany: function(store, type, ids) {
      var docs,
        _this = this;
      docs = ids.map(function(item) {
        item = EmberCouchDBKit.sharedStore.get('attachment', item);
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
;/*
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
          hash[key] = EmberCouchDBKit.sharedStore.mapRevIds('revs', this.extractId(type, hash))[1];
        }
        if (relationship.kind === "hasMany") {
          return hash[key] = EmberCouchDBKit.sharedStore.mapRevIds('revs', this.extractId(type, hash));
        }
      }), this);
    }
  });

  /*
    `RevAdapter` is an adapter which gets revisions info by distinct document and used
    as a main adapter for history enabled models.
  
    Let's consider `belongsTo` relation which returns previous version of document:
      ```coffee
      App.Task = DS.Model.extend
        title: DS.attr('string')
        history: DS.belongsTo('history')
  
  
      App.History = DS.Model.extend
        # previous version of task entry
        task: DS.belongsTo('task', {inverse: null})
        # list of all available versions of task entry
        tasks: DS.hasMany('task', {inverse: null, async: true})
      ```
  
    For getting more details check `spec/coffeescripts/revs-adapter_spec.coffee` file.
  
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
          EmberCouchDBKit.sharedStore.add('revs', id, data);
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
;/*

  This module provides convinience for working with CouchDB's `/changes` feeds

  For instance:

    ```coffee
    # Create feed with custom parameters
    feed = EmberCouchDBKit.ChangesFeed.create({ db: 'docs', content: params })
    feed.longpoll(callback)

    # Start listening from the last sequence
    self = @
    feed.fromTail((=> feed.longpoll(self.filter, self)))

    # Destroy feed listening
    feed.stop().destroy()
    ```

@namespace EmberCouchDBKit
@class ChangesFeed
@extends Ember.ObjectProxy
*/


(function() {
  EmberCouchDBKit.ChangesFeed = Ember.ObjectProxy.extend({
    content: {},
    longpoll: function() {
      this.feed = 'longpoll';
      return this._ajax.apply(this, arguments);
    },
    normal: function() {
      this.feed = 'normal';
      return this._ajax.apply(this, arguments);
    },
    continuous: function() {
      this.feed = 'continuous';
      return this._ajax.apply(this, arguments);
    },
    fromTail: function(callback) {
      var _this = this;
      return $.ajax({
        url: "%@%@/_changes?descending=true&limit=1".fmt(this._buildUrl(), this.get('db')),
        dataType: 'json',
        success: function(data) {
          _this.set('since', data.last_seq);
          if (callback) {
            return callback.call(_this);
          }
        }
      });
    },
    stop: function() {
      this.set('stopTracking', true);
      return this;
    },
    start: function(callback) {
      this.set('stopTracking', false);
      return this.fromTail(callback);
    },
    _ajax: function(callback, self) {
      var _this = this;
      return $.ajax({
        type: "GET",
        url: this._makeRequestPath(),
        dataType: 'json',
        success: function(data) {
          var _ref;
          if (!_this.get('stopTracking')) {
            if ((data != null ? (_ref = data.results) != null ? _ref.length : void 0 : void 0) && callback) {
              callback.call(self, data.results);
            }
            return _this.set('since', data.last_seq);
          }
        },
        complete: function() {
          if (!_this.get('stopTracking')) {
            return setTimeout((function() {
              return _this._ajax(callback, self);
            }), 1000);
          }
        }
      });
    },
    _buildUrl: function() {
      var url;
      url = this.get('host') || "/";
      if (url.substring(url.length - 1) !== "/") {
        url += "/";
      }
      return url;
    },
    _makeRequestPath: function() {
      var feed, params;
      feed = this.feed || 'longpool';
      params = this._makeFeedParams();
      return "%@%@/_changes?feed=%@%@".fmt(this._buildUrl(), this.get('db'), feed, params);
    },
    _makeFeedParams: function() {
      var path,
        _this = this;
      path = '';
      ["include_docs", "limit", "descending", "heartbeat", "timeout", "filter", "filter_param", "style", "since"].forEach(function(param) {
        if (_this.get(param)) {
          return path += "&%@=%@".fmt(param, _this.get(param));
        }
      });
      return path;
    }
  });

}).call(this);
