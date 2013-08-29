var App = Ember.Application.create();



// Models

App.Store = DS.Store.extend({
  revision: 13,
  adapter: EmberCouchDBKit.DocumentAdapter.create({db: 'boards'})
});

App.Store.registerAdapter('App.Attachment', EmberCouchDBKit.AttachmentAdapter.extend({db: 'boards'}));

App.Issue = DS.Model.extend({
  text: DS.attr('string'),
  type: DS.attr('string', {defaultValue: 'issue'}),
  board: DS.attr('string'),
  attachments: DS.hasMany('App.Attachment', {embedded: true})
});

App.Attachment = DS.Model.extend({
  content_type: DS.attr('string'),
  length: DS.attr('number'),
  file_name: DS.attr('string'),
  db: DS.attr('string')
});

App.Position = DS.Model.extend({
  issues: DS.hasMany('App.Issue', {embeded: true}),
  type: DS.attr('string', {defaultValue: 'position'})
});


App.Boards = ['common', 'intermediate', 'advanced'];


// Routes

App.IndexRoute = Ember.Route.extend({

  setupController: function(controller, model) {
    this._position();
    this._issue();
    //this._setupPosition();
  },

  renderTemplate: function() {
    this.render();
    this.render('board',{outlet: 'common', into: 'index', controller: 'common'});
    this.render('board',{outlet: 'intermediate', into: 'index', controller: 'intermediate'});
    this.render('board',{outlet: 'advanced', into: 'index', controller: 'advanced'});
  },

  // [TODO] rewrite me, depends by opne issue
  // https://github.com/roundscope/ember-couchdb-kit/issues/54
  _setupPosition: function() {
    App.Boards.forEach(function(type) {
      doc = App.Position.find(type);
      if (!(doc.get('isLoaded'))){
        issue = App.Position.createRecord({ id: type });
        issue.get('store').commit();
      }
    });
  },

  _position: function(){
    // create a CouchDB `/_change` position listener which filtered only by position documents
    params = { include_docs: true, timeout: 100, filter: 'issues/only_positions'}
    position = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', content: params });

    // all upcoming changes are passed to `_handlePositionChanges` callback through `longpoll` strategy
    position.longpoll(this._handlePositionChanges, this);
  },

  _handlePositionChanges: function(data) {
    self = this;
    data.forEach(function(obj){
      controller = self.controllerFor(obj.doc._id);
      if (controller.get('position') == App.Position.find(obj.doc._id)){ 
        controller.get('position').reload();
      }else{
        controller.set('position', App.Position.find(obj.doc._id));   
        controller.get('position').one('didLoad', function() {
          controller = self.controllerFor(obj.doc._id);
          issues = controller.get('position.issues');
          controller.set('content', issues);
        });
      }
    });   
  },

  _issue: function(){
    // create a CouchDB `/_change` issue listener which filtered only by issue documents
    params = { include_docs: true, timeout: 100, filter: 'issues/issue'}
    issue = EmberCouchDBKit.ChangesFeed.create({ db: 'boards', content: params });

    // all upcoming changes are passed to `_handleIssueChanges` callback through `fromTail` strategy
    self = this;
    issue.fromTail( (function(){
      return issue.longpoll(self._handleIssueChanges, self);
    }) );
  },

  _handleIssueChanges: function(data) {
    self = this;
    data.forEach(function(obj){
      controller = self.controllerFor(obj.doc.board);
      if ((controller.get('content').mapProperty('id').indexOf(obj.doc._id) >= 0)){
        App.Issue.find(obj.doc._id).reload();
      }
    });
  }
});



// Controllers

App.IndexController = Ember.ArrayController.extend({
  createIssue: function(fields) {
    issue = App.Issue.createRecord(fields);
    issue.get('store').commit();
    issue.on('didCreate', function() {
      position = App.Position.find(fields.board);
      position.get('issues').pushObject(issue);
      position.get('transaction').commit();
    });
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

App.NewIssueView = Ember.View.extend({
  tagName: "form",

  create: false,
  
  attributeBindings: ["style"],
  
  style: "display:inline",
  
  _save:  function(event) {
    event.preventDefault();
    if (this.get('create')){
      this.get('controller').send("createIssue", {text: this.get("TextArea.value"), board: this.get('controller.name')} );
    }
    this.toggleProperty('create');
  },
  
  submit: function(event){
    this._save(event);
  },
  
  keyDown: function(event){
    if(event.keyCode == 13){
      this._save(event);
    }
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

App.IssueView = Ember.View.extend({
  tagName: "form",
  
  edit: false,
  
  submit: function(event){
    event.preventDefault();
    if (this.get('edit')){
      this.get('controller').send('saveMessage', this.get("context"));
    }
    this.toggleProperty('edit');
  },
  
  attributeBindings: ['draggable'],
  
  draggable: 'true',

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
