class @DatabaseCleaner
  @reset: ->
    @destroy()
    @create()

  @create: ->
    @_ajax('PUT')

  @destroy: ->
    @_ajax('DELETE')

  @_ajax: (type) ->
    jQuery.ajax({
      url:  "/doc",
      type: type,
      dataType:    'json',
      contentType: "application/json"
      cache:       true,
      async: false
    })