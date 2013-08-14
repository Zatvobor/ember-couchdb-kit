Installation
============

```
bundle install
```

setup application related design docs

```
curl -X PUT http://localhost:5984/boards/_design/issues -H 'Content-Type: application/json' -d '
{
   "_id": "_design/issues",
   "language": "javascript",
   "views": {
       "all": {
           "map": "function(doc) { if (doc.type == \"issue\")  emit(null, {_id: doc._id}) }"
       },
       "all_by_board": {
           "map":  "function(doc) { if (doc.type == \"issue\")  emit(doc.board, {_id: doc._id}) }"
       }
   }
}'
```

Run
===

```
rackup
curl http://localhost:3000/version
# => 200, ember-couchdb-kit example app
open -a safari http://localhost:3000/example_app/index.html
```
