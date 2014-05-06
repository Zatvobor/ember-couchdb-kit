
//  Views

App.IssueView = Ember.View.extend({
  tagName: "form",
  edit: false,
  attributeBindings: ['draggable'],
  draggable: 'true',

  submit: function(event) {
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
    if((this.draggable === 'true') || (view.draggable === 'true')){
      this.get('controller').send("dropIssue", view.get('controller'), view.get('context'), this.get('context'));
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
  tagName: "button",
  classNames: ['btn', 'btn-xs', 'btn-danger'],

  click: function(event){
    event.preventDefault();
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

  actions: {
    browseFile: function(e){
     this.$().click();
    }
  },

  change: function(event) {
    this.get('controller').send('addAttachment', event.target.files, this.get('context'));
  }
});

App.FocusedTextArea = Ember.TextArea.extend({
  elementDidChange: function() {
    this.$().focus();
  }.observes('element')
});

Ember.Handlebars.helper('linkToAttachment', function(attachment) {
  aTagTemplate= "<a href='%@' target='_blank'>%@</a>"
  url = "%@/%@/%@".fmt(App.Host, attachment.get('_data.db'), attachment.get('id'));
  return new Handlebars.SafeString(
    aTagTemplate.fmt(url, attachment.get('file_name'))
  );
});
