ember-couchdb-kit
=================

An `ember-data` kit for Apache CouchDB.

We love a CouchDB and its RESTful and many other core things such as MVCC, attachments and /_changes. These all brings your data and application flow together as well.

Inspired by [pangratz/ember-couchdb-adapter](https://github.com/pangratz/ember-couchdb-adapter) and contains many fixes and newbie features.

There are some of these:

* natural `find/create/deleteRecord` functions;
* ability to work with `views`;
* document's attachements designed as `hasMany` relation;
* document's revisions designed as `belongsTo` relationship that points back such as corresponding `hasMany` relation;
* ability to work with `/_changes`;


Check source docs for more examples and details.

License
-------

`ember-couchdb-kit` source code is released under MIT-License.
Check [MIT-LICENSE](https://github.com/roundscope/ember-couchdb-kit/blob/master/MIT-LICENSE) for more details.
