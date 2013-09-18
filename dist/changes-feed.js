/*

  For instance:

    ```
    feed = EmberCouchDBKit.ChangesFeed.create({ db: 'docs', content: params })
    callback = (data) -> # here you're able to handle recent change
    feed.longpoll(callback)
    ```

  Start listening from the last sequence

    ```
    feed = EmberCouchDBKit.ChangesFeed.create({ db: 'docs', content: params})
    self = @
    feed.fromTail((=> feed.longpoll(self.filter, self)))
    ```

  Unsibscribe from listening

    ```
    feed.destroy()
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
      return this.set('stopTracking', true);
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
            _this.set('since', data.last_seq);
            return _this._ajax(callback, self);
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
