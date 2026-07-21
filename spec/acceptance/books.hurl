# Books: store a source and its Open Library cover identifier.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-book",
  "password": "correct-horse-battery-staple"
}
HTTP 201

POST {{base}}/books
Content-Type: application/json
{
  "title": "The Pragmatic Programmer",
  "author": "Andrew Hunt",
  "open_library_key": "/works/OL123W",
  "cover_id": 12345
}
HTTP 201
[Captures]
book_id: jsonpath "$.id"
[Asserts]
jsonpath "$.title" == "The Pragmatic Programmer"
jsonpath "$.author" == "Andrew Hunt"
jsonpath "$.open_library_key" == "/works/OL123W"
jsonpath "$.cover_id" == 12345

POST {{base}}/notes
Content-Type: application/json
{
  "title": "Ownership",
  "body": "Each value has one owner.",
  "book_id": "{{book_id}}"
}
HTTP 201
[Captures]
note_id: jsonpath "$.id"
[Asserts]
jsonpath "$.book_id" == {{book_id}}

GET {{base}}/books/{{book_id}}
HTTP 200
[Asserts]
jsonpath "$.cover_id" == 12345

GET {{base}}/books
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$[*].id" contains {{book_id}}

DELETE {{base}}/books/{{book_id}}
HTTP 204

GET {{base}}/books/{{book_id}}
HTTP 404

GET {{base}}/notes/{{note_id}}
HTTP 200
[Asserts]
jsonpath "$.book_id" == {{book_id}}
