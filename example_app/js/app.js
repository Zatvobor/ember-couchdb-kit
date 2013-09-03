var App = Ember.Application.create();

App.Boards = ['common', 'intermediate', 'advanced'];


// Models

App.Store = DS.Store.extend({
  revision: 13,
  adapter: EmberCouchDBKit.DocumentAdapter.create({db: 'boards'})
});

App.Store.registerAdapter('App.Attachment', EmberCouchDBKit.AttachmentAdapter.extend({db: 'boards'}));

App.Issue = DS.Model.extend({
  text: DS.attr('string'),
  type: DS.attr('string', {defaultValue: 'issue'}),
  board: DS.belongsTo('App.Position'),
  attachments: DS.hasMany('App.Attachment', {embedded: true})
});

App.Attachment = DS.Model.extend({
  content_type: DS.attr('string'),
  length: DS.attr('number'),
  file_name: DS.attr('string'),
  db: DS.attr('string')
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
    self = this;
    App.Boards.forEach(function(label) {
       self.render('board',{outlet: label, into: 'index', controller: label});
    });
  },

  _setupPositionHolders: function() {
    self = this;
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
    position.longpoll(this._handlePositionChanges, this);
  },

  _handlePositionChanges: function(data) {
    self = this;
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
    self = this;
    issue.fromTail(function(){
      issue.longpoll(self._handleIssueChanges, self);
    });
  },

  _handleIssueChanges: function(data) {
    self = this;
    // apply received updates
    data.forEach(function(obj){
      issue = App.Issue.find(obj.doc._id);
      if(issue.get('isLoaded')) issue.reload();
    });
  }
});



// Controllers

App.IndexController = Ember.Controller.extend({

  content: Ember.computed.alias('position.issues'),

  createIssue: function(fields) {
    fields.board = App.Position.find(this.get('name'));
    issue = App.Issue.createRecord(fields);
    //issue.set('board', App.Position.find(this.get('name')));
    issue.get('store').commit();

    //issue.on('didCreate', function() {
    //issue.addObserver('id', function(sender, key, value, context, rev) {
    //  this.get('board.issues').pushObject(this);
    //});
  },
  saveMessage: function(model) {
    model.save();
  },
  deleteMessage: function(message) {
    message.deleteRecord();
    message.get('store').commit();

    this.get('content').removeObject(message);
  },
  browseFile: function(view) {
    viewId = view.get('elementId');
    document.getElementById(viewId).click();
  },
  needs: App.Boards
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
      this.get('controller').send('saveMessage', this.get("context"));
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
    var viewId = event.dataTransfer.getData('id');
    var view = Ember.View.views[viewId];
    var newModel = view.get('context');
    var oldModel = this.get('context');
    var position = this.get('controller.content').toArray().indexOf(oldModel)
    view.get('controller.content').removeObject(newModel);
    thisArray = this.get('controller.content').toArray().insertAt(position, newModel);
    this.set('controller.content.content', thisArray.getEach('_reference'));
    this.set('controller.position.issues.content', thisArray.getEach('_reference'));
    this.get('controller.position').save();

    if(view.get('controller.name') !== this.get('controller.name')){
      newModel.set('board', this.get('controller.name'));
      newModel.get('store').commit();
      viewArray = view.get('controller.content').toArray();
      view.set('controller.content.content', viewArray.getEach('_reference'));
      view.set('controller.position.issues.content', viewArray.getEach('_reference'));
      view.get('controller.position').save();
    }
    event.preventDefault();
    event.target.style.opacity = '1';
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
      this.get('controller').send("createIssue", {text: this.get("TextArea.value")});
    }
    this.toggleProperty('create');
  }
});


App.FocusedTextArea = Ember.TextArea.extend({
  attributeBindings: ['autofocus'],
  autofocus: 'autofocus'
});


App.CancelView = Ember.View.extend({
  tagName: "span",
  
  click: function(event){
    event.preventDefault();
    this.set('parentView.create',false);
  }
});


App.DeleteView = Ember.View.extend({
  tagName: "span",

  click: function(event){
    event.preventDefault();
    this.get('controller').send('deleteMessage', this.get('context'));
  }
});


App.AttachmentView = Ember.TextField.extend({
  type: 'file',
  attributeBindings: ["style"],
  style: "display:none",
  change: function(event) {
    id = this.get('elementId')
    console.log(event.target.files);
    var files = event.target.files;

    for (var i = 0, f; f = files[i]; i++) {
      if (!f.type.match('image.*')) {
        continue;
      }
      console.log( f.name, f.type, f.size || 'n/a', f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a');
    }

  }
});
