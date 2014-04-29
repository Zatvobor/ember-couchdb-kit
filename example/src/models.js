
// Models

App.ApplicationAdapter =  EmberCouchDBKit.DocumentAdapter.extend({db: 'boards', host: App.Host});
App.ApplicationSerializer = EmberCouchDBKit.DocumentSerializer.extend();

App.AttachmentAdapter = EmberCouchDBKit.AttachmentAdapter.extend({db: 'boards', host: App.Host});
App.AttachmentSerializer = EmberCouchDBKit.AttachmentSerializer.extend();

App.Issue = DS.Model.extend({
  text: DS.attr('string'),
  type: DS.attr('string', {defaultValue: 'issue'}),
  attachments: DS.hasMany('attachment', {async: true})
});

App.Attachment = DS.Model.extend({
  content_type: DS.attr('string'),
  length: DS.attr('number'),
  file_name: DS.attr('string'),
  db: DS.attr('string', {defaultValue: 'boards'})
});

App.Position = DS.Model.extend({
  issues: DS.hasMany('issue', {async: true}),
  type: DS.attr('string', {defaultValue: 'position'})
});
