var App = Ember.Application.create();

App.Store = DS.Store.extend({
    revision: 13,
    adapter: EmberCouchDBKit.DocumentAdapter.create({db: 'board'})
});

App.Issue = DS.Model.extend({
    text: DS.attr('string'),
    type: DS.attr('string', {defaultValue: 'issue'})
});

App.IndexRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        this.get('controller').set('content', []);
        //this.feed()
    },
    feed: function(){
        feed = EmberCouchDBKit.ChangesFeed.create({ db: 'board', content: {"include_docs": true, "timeout":1000}});
        feed.longpoll(this.callback, this);
    },
    callback: function(data){
    	indexController = this.controllerFor("index");
        store = indexController.get('store')
        data.forEach(function(obj){
            if ((obj.doc.text)&&(obj.doc.type =='issue')){ 
                    store.adapterForType(App.Issue).load(store, App.Issue, obj.doc);
                    message = App.Issue.find(obj.doc._id);
                    indexController.get('content').pushObject(message);
            }
        })
    }
}); 

App.IndexController = Ember.ArrayController.extend({
    createMessage: function(fields) {
        message = App.Issue.createRecord(fields);
        message.get('store').commit();
    }
});

App.Board = ["Basic","Intermediate","Advanced"];

App.BoardView = Ember.View.extend({
    tagName: "li"
});

App.NewIssueView = Ember.View.extend({
    tagName: "form",
    create: false,
    submit: function(event){
        event.preventDefault();
        this.get('controller').send("createMessage", {text: this.get("TextArea.value")} );
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
