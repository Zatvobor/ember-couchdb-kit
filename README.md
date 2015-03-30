ember-couchdb-kit
=================

Versions:

* `v1.0.3` works with `ember 1.8.1` and `ember-data 1.0.0-beta.15`
* `v1.0.0` works with `ember 1.5.1` and `ember-data 1.0.0-beta.7`
* `v0.9.0` works with `ember 1.0.0` and `ember-data 1.0.0-beta.3`
* `v0.8.0` works with `ember 1.0.0` and `ember-data 1.0.0-beta.2`
* `v0.7.0` works with `ember rc.6.1` and `ember-data 0.13`


An `ember-data` kit for Apache CouchDB. A collection of adapters to work
with CouchDB documents, attachments, revisions, changes feed.

We love a CouchDB and its RESTful and many other core things such as MVCC, attachments and `/_changes`. These all brings your data and application flow together as well.

Inspired by [pangratz/ember-couchdb-adapter](https://github.com/pangratz/ember-couchdb-adapter) and contains many fixes and newbie features.

There are some of these:

* natural `find/create/deleteRecord` functions;
* ability to work with `views`;
* document's attachements designed as `hasMany` relationship;
* document's revisions designed as `belongsTo` and `hasMany` relationships;
* ability to work with `/_changes` feeds;


Usage
=====

Check the usage example in `/example` directory.

Ready to use as a regular JS assets
-----------------------------------

An `ember-couchdb-kit` ships with compiled assets which is placed in `dist` directory.


Install with bower
----------------

```
bower install ember-couchdb-kit
```

Contribution
------------

See [CONTRIBUTING.md](CONTRIBUTING.md)

License
-------

`ember-couchdb-kit` source code is released under MIT-License.
Check [MIT-LICENSE](MIT-LICENSE) for more details.

[![Analytics](https://ga-beacon.appspot.com/UA-61065309-1/Zatvobor/ember-couchdb-kit/README)](https://github.com/igrigorik/ga-beacon)
