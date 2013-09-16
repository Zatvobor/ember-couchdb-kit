Simple application which brings together all features and shows on practice how to use `ember-couchdb-kit`

Installation
============

```
bundle install
```

setup application related design docs

```
curl -X PUT http://localhost:5984/boards
```

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
   },
   "filters": {
     "only_positions": "function(doc, req) { if(doc.type == \"position\") { return true; } }",
     "issue": "function(doc, req) {if(doc.type == \"issue\") { return true; } }"
   }
}'
```

```
curl -X PUT http://127.0.0.1:5984/boards/common -H 'Content-Type: application/json' -d '{
     "type": "position"
}'

curl -X PUT http://127.0.0.1:5984/boards/advanced -H 'Content-Type: application/json' -d '{
     "type": "position"
}'

curl -X PUT http://127.0.0.1:5984/boards/intermediate -H 'Content-Type: application/json' -d '{
     "type": "position"
}'
```

Run
===

```
rackup
curl http://localhost:3000/version
# => 200, ember-couchdb-kit example app
open -a safari http://localhost:3000/example/index.html
```
