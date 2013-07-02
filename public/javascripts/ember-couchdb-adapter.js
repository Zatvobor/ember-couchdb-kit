(function() {
  window.DS.CouchDBSerializer = DS.JSONSerializer.extend({
    typeAttribute: 'ember_type',
    addEmptyHasMany: false,
    addEmptyBelongsTo: false,
    materialize: function(record, hash) {
      this._super.apply(this, arguments);
      return record.materializeAttribute("_rev", hash.rev || hash._rev);
    },
    serialize: function(record, options) {
      var json;

      json = this._super.apply(this, arguments);
      this.addRevision(json, record, options);
      this.addTypeAttribute(json, record);
      return json;
    },
    extract: function(loader, json, type) {
      return this.extractRecordRepresentation(loader, type, json);
    },
    extractId: function(type, hash) {
      return hash._id || hash.id;
    },
    stringForType: function(type) {
      return type.toString();
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

      typeAttribute = this.get('typeAttribute');
      return json[typeAttribute] = this.stringForType(record.constructor);
    },
    addHasMany: function(data, record, key, relationship) {
      var value;

      value = record.get(key);
      if (this.get('addEmptyHasMany') || !Ember.empty(value)) {
        return data[key] = value.getEach('id');
      }
    },
    addBelongsTo: function(hash, record, key, relationship) {
      var id;

      id = get(record, relationship.key + '.id');
      if (this.get('addEmptyBelongsTo') || !Ember.empty(id)) {
        return hash[key] = id;
      }
    }
  });

}).call(this);
