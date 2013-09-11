var App = Ember.Application.create();

App.Boards = ['common', 'intermediate', 'advanced'];


// Models

App.Store = DS.Store.extend({
  adapter: EmberCouchDBKit.DocumentAdapter.create({db: 'boards'})
});

App.Store.registerAdapter('App.Attachment', EmberCouchDBKit.AttachmentAdapter.extend({db: 'boards'}));

App.Issue = DS.Model.extend({
  text: DS.attr('string'),
  type: DS.attr('string', {defaultValue: 'issue'}),
  attachments: DS.hasMany('App.Attachment', {embedded: true})
});

App.Attachment = DS.Model.extend({
  content_type: DS.attr('string'),
  length: DS.attr('number'),
  file_name: DS.attr('string'),
  _rev: DS.attr('string'),
  db: DS.attr('string', {defaultValue: 'boards'})

});

App.Position = DS.Model.extend({
  issues: DS.hasMany('App.Issue'),
  type: DS.attr('string', {defaultValue: 'position'})
});


// Routes

App.IndexRoute = Ember.Route.extend({

  setupController: function(controller, model) {
    this._setupPositionHolders();
    this._position();
    this._issue();
  },

  renderTemplate: function() {
    this.render();
    // link particular controller with its outlet
    var self = this;
    App.Boards.forEach(function(label) {
       self.render('board',{outlet: label, into: 'index', controller: label});
    });
  },

  _setupPositionHolders: function() {
    var self = this;
    App.Boards.forEach(function(type) {
      // set issues into appropriate controller through position model
      position = App.Position.find(type);
      position.one('didLoad', function() {
        self.controllerFor(type).set('position', this);
      });
      // create position documents (as a part of first time initialization)
      if (position.get('store.adapter').is(404, {for: type})) {
        App.Position.createRecord({ id: type }).get('store').commit();
      }
    });
  },

  _position: function(){
    // create a CouchDB `/_change` listener which serves an position documents
    params = { include_docs: true, timeout: 100, filter: 'issues/only_positions'}
    position = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', content: params });

    // all upcoming changes are passed to `_handlePositionChanges` callback through `longpoll` strategy
    var self = this;
    position.fromTail(function(){
      position.longpoll(self._handlePositionChanges, self);
    });
  },

  _handlePositionChanges: function(data) {
    var self = this;
    data.forEach(function(obj){
      position = self.controllerFor(obj.doc._id).get('position');
      // we should reload particular postion model in case of update is received from another user
      if (position.get('_data.raw._rev') != obj.doc._rev)
        position.reload();
    });
  },

  _issue: function() {
    // create a CouchDB `/_change` issue listener which serves an issues
    params = { include_docs: true, timeout: 100, filter: 'issues/issue'}
    issue = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', content: params });

    // all upcoming changes are passed to `_handleIssueChanges` callback through `fromTail` strategy
    var self = this;
    issue.fromTail(function(){
      issue.longpoll(self._handleIssueChanges, self);
    });
  },

  _handleIssueChanges: function(data) {
    // apply received updates
    data.forEach(function(obj){
      issue = App.Issue.find(obj.doc._id);
      if(issue.get('isLoaded')){
        issue.reload();
      }
    });
  }
});



// Controllers

App.IndexController = Ember.Controller.extend({

  content: Ember.computed.alias('position.issues'),

  createIssue: function(text) {
    issue = App.Issue.createRecord({text: text});
    issue.save();

    var self = this;
    issue.addObserver('id', function(sender, key, value, context, rev) {
      self.get('content').pushObject(this);
      self.get('position').save();
    });
  },

  saveIssue: function(model) {
    model.save();
  },

  deleteIssue: function(issue) {
    this.get('content').removeObject(issue);
    this.get('position').save();
    issue.deleteRecord();
    issue.save();
  },

  deleteAttachment: function(attachment){
    attachment.get('_data.document.attachments').removeObject(attachment)
    attachment.get('_data.document').save();
    attachment.deleteRecord();
  },

  addAttachment: function(files, model){
    this._addAttachment(0, files, files.length, model)
  },

  _addAttachment: function(count, files, size, model){
    file = files[count];
    attachmentId = "%@/%@".fmt(model.id, file.name);

    params = {
      doc_id: model.id,
      doc_type: App.Issue,
      rev: model._data._rev,
      id: attachmentId,
      file: file,
      content_type: file.type,
      length: file.size,
      file_name: file.name
    }

    var self = this;
    attachment = App.Attachment.createRecord(params);
    attachment.get('store').commit();
    attachment.one('didCreate', function() {
      Ember.run.next(function() {
        count = count + 1;
        if(count < size){
          self._addAttachment(count, files, size, model);
        }
      });
    });
  }
});

App.CommonController       = App.IndexController.extend({ name: 'common' });
App.IntermediateController = App.IndexController.extend({ name: 'intermediate' });
App.AdvancedController     = App.IndexController.extend({ name: 'advanced' });



//  Views

App.IssueView = Ember.View.extend({
  tagName: "form",
  edit: false,
  attributeBindings: ['draggable'],
  draggable: 'true',

  submit: function(event){
    event.preventDefault();
    if (this.get('edit')){
      this.get('controller').send("saveIssue", this.get('context') );
    }
    this.toggleProperty('edit');
  },

  dragStart: function(event) {
    event.dataTransfer.setData('id', this.get('elementId'));
  },

  dragEnter: function(event) {
    event.preventDefault();
    event.target.style.opacity = '0.4';
  },

  dragOver: function(event) {
    event.preventDefault();
  },

  dragLeave: function(event) {
    event.preventDefault();
    event.target.style.opacity = '1';
  },

  drop: function(event) {
    var view = Ember.View.views[event.dataTransfer.getData('id')];
    var newModel = view.get('context');
    var position = this.get('controller.content').toArray().indexOf(this.get('context'))

    view.get('controller.content').removeObject(newModel);
    thisArray = this.get('controller.content').toArray().insertAt(position, newModel);
    this._insert(this, thisArray)

    if(view.get('controller.name') !== this.get('controller.name')){
      newModel.set('board', this.get('controller.name'));
      newModel.get('store').commit();
      viewArray = view.get('controller.content').toArray();
      this._insert(view, viewArray)
    }

    event.preventDefault();
    event.target.style.opacity = '1';
  },

  _insert: function(view, array){
    view.set('controller.content.content', array.getEach('_reference'));
    view.get('controller.position').save();
  }
});

App.NewIssueView = Ember.View.extend({

  tagName: "form",
  create: false,
  attributeBindings: ["style"],
  style: "display:inline",

  submit: function(event){
    this._save(event);
  },

  keyDown: function(event){
    if(event.keyCode == 13){
      this._save(event);
    }
  },

  _save: function(event) {
    event.preventDefault();
    if (this.get('create')){
      text = this.get("TextArea.value");
      if(!Ember.isEmpty(text)){
        this.get('controller').send("createIssue", text);
      }
    }
    this.toggleProperty('create');
  }
});

App.CancelView = Ember.View.extend({
  tagName: "span",

  click: function(event){
    event.preventDefault();
    this.set('parentView.create',false);
  }
});

App.DeleteIssueView = Ember.View.extend({
  tagName: "span",

  click: function(event){
    event.preventDefault();
    this.$().attr('disabled', true);
    this.get('controller').send('deleteIssue', this.get('context'));
  }
});

App.DeleteAttachmentView = Ember.View.extend({
  tagName: "span",
  classNames: ['badge'],
  click: function(event){
    event.preventDefault();
    this.get('controller').send('deleteAttachment', this.get('context'));
  }
});

App.AttachmentView = Ember.View.extend({
  
  tagName: "input",
  attributeBindings: ["style", "type", "multiple"],
  style: "display:none",
  type: 'file',
  multiple: true,

  change: function(event) {
    this.get('controller').send('addAttachment', event.target.files, this.get('context'));
  },

  browseFile: function(event) {
    this.$().click();
  }
});

Ember.TextArea.reopen({
  attributeBindings: ['viewName'],
  elementDidChange: function() {
    this.$().focus();
  }.observes('element')
});

Ember.Handlebars.helper('linkToAttachment', function(attachment) {
  return new Handlebars.SafeString('/%@/%@'.fmt( attachment.get('_data.db'), attachment.get('id')));
});
