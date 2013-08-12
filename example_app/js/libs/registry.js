(function() {
  var _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EmberCouchDBKit.BaseRegistry = (function() {
    function BaseRegistry() {}

    BaseRegistry.registiry = {};

    BaseRegistry.add = function(key, value) {
      return this.registiry[key] = value;
    };

    BaseRegistry.get = function(key) {
      return this.registiry[key];
    };

    BaseRegistry.remove = function() {
      return delete this.registiry[key];
    };

    return BaseRegistry;

  })();

  EmberCouchDBKit.RevsStore = (function(_super) {
    __extends(RevsStore, _super);

    function RevsStore() {
      _ref = RevsStore.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RevsStore.mapRevIds = function(key) {
      var _this = this;

      return this.get(key)._revs_info.map(function(_rev) {
        return "%@/%@".fmt(_this.get(key)._id, _rev.rev);
      });
    };

    return RevsStore;

  })(EmberCouchDBKit.BaseRegistry);

  EmberCouchDBKit.AttachmentStore = (function(_super) {
    __extends(AttachmentStore, _super);

    function AttachmentStore() {
      _ref1 = AttachmentStore.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return AttachmentStore;

  })(EmberCouchDBKit.BaseRegistry);

  EmberCouchDBKit.ChangesWorkers = (function(_super) {
    __extends(ChangesWorkers, _super);

    function ChangesWorkers() {
      _ref2 = ChangesWorkers.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    ChangesWorkers.stopAll = function() {
      var k, v, _ref3, _results;

      _ref3 = this.registiry;
      _results = [];
      for (k in _ref3) {
        v = _ref3[k];
        _results.push(v.stop());
      }
      return _results;
    };

    return ChangesWorkers;

  })(EmberCouchDBKit.BaseRegistry);

}).call(this);
