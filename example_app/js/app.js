var App = Ember.Application.create();

App.Store = DS.Store.extend({
    revision: 13,
    adapter: EmberCouchDBKit.DocumentAdapter.create({db: 'board'})
});

App.Issue = DS.Model.extend({
    text: DS.attr('string'),
    type: DS.attr('string', {defaultValue: 'message'})
});

App.IndexRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        this.get('controller').set('content', []);
    }
}); 

App.IndexController = Ember.ArrayController.extend({

});
