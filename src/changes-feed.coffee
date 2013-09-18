###

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
###
EmberCouchDBKit.ChangesFeed = Ember.ObjectProxy.extend
  
  content: {} # by default

  longpoll: ->
    @feed = 'longpoll'
    @_ajax.apply(@, arguments)

  normal: ->
    @feed = 'normal'
    @_ajax.apply(@, arguments)

  continuous: ->
    @feed = 'continuous'
    @_ajax.apply(@, arguments)


  fromTail: (callback)->
    $.ajax({
      url: "%@%@/_changes?descending=true&limit=1".fmt(@_buildUrl(), @get('db')),
      dataType: 'json',
      success: (data) =>
        @set('since', data.last_seq)
        callback.call(@) if callback
    })

  stop: ->
    @set('stopTracking', true)
    @

  start: (callback) ->
    @set('stopTracking', false)
    @fromTail(callback)

  _ajax: (callback, self) ->
    $.ajax({
      type: "GET",
      url: @_makeRequestPath(),
      dataType: 'json',
      success: (data) =>
        unless @get('stopTracking')
          callback.call(self, data.results) if data?.results?.length && callback
          @set('since', data.last_seq)
          @_ajax(callback, self)
     })

  _buildUrl: ->
    url = @get('host') || "/"
    url +="/" unless url.substring(url.length-1) == "/"
    url

  _makeRequestPath: ->
    feed   = @feed || 'longpool'
    params = @_makeFeedParams()

    "%@%@/_changes?feed=%@%@".fmt(@_buildUrl(), @get('db'), feed, params)

  _makeFeedParams: ->
    path = ''
    ["include_docs", "limit", "descending", "heartbeat", "timeout", "filter", "filter_param", "style", "since"].forEach (param) =>
      path += "&%@=%@".fmt(param, @get(param)) if @get(param)
    path
