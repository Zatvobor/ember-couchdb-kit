(function() {
  var _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EmberCouchDBKit.BaseRegistry = (function() {
    function BaseRegistry() {
      this.registiry = {};
    }

    BaseRegistry.prototype.add = function(key, value) {
      return this.registiry[key] = value;
    };

    BaseRegistry.prototype.get = function(key) {
      return this.registiry[key];
    };

    BaseRegistry.prototype.remove = function() {
      return delete this.registiry[key];
    };

    return BaseRegistry;

  })();

  EmberCouchDBKit.RevsStoreClass = (function(_super) {
    __extends(RevsStoreClass, _super);

    function RevsStoreClass() {
      _ref = RevsStoreClass.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RevsStoreClass.prototype.mapRevIds = function(key) {
      var _this = this;
      return this.get(key)._revs_info.map(function(_rev) {
        return "%@/%@".fmt(_this.get(key)._id, _rev.rev);
      });
    };

    return RevsStoreClass;

  })(EmberCouchDBKit.BaseRegistry);

  EmberCouchDBKit.RevsStore = new EmberCouchDBKit.RevsStoreClass();

  EmberCouchDBKit.AttachmentStoreClass = (function(_super) {
    __extends(AttachmentStoreClass, _super);

    function AttachmentStoreClass() {
      _ref1 = AttachmentStoreClass.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return AttachmentStoreClass;

  })(EmberCouchDBKit.BaseRegistry);

  EmberCouchDBKit.AttachmentStore = new EmberCouchDBKit.AttachmentStoreClass();

  EmberCouchDBKit.ChangesWorkersClass = (function(_super) {
    __extends(ChangesWorkersClass, _super);

    function ChangesWorkersClass() {
      _ref2 = ChangesWorkersClass.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    ChangesWorkersClass.prototype.stopAll = function() {
      var k, v, _ref3, _results;
      _ref3 = this.registiry;
      _results = [];
      for (k in _ref3) {
        v = _ref3[k];
        _results.push(v.stop());
      }
      return _results;
    };

    return ChangesWorkersClass;

  })(EmberCouchDBKit.BaseRegistry);

  EmberCouchDBKit.ChangesWorkers = new EmberCouchDBKit.ChangesWorkersClass();

}).call(this);
