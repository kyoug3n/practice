# Resources of another account are explicitly forbidden.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-a",
  "password": "correct-horse-battery-staple"
}
HTTP 201

POST {{base}}/notes
Content-Type: application/json
{
  "title": "Alice private note",
  "body": "Only Alice can use it."
}
HTTP 201
[Captures]
note_id: jsonpath "$.id"

POST {{base}}/cards
Content-Type: application/json
{
  "note_id": "{{note_id}}",
  "front": "Private question",
  "back": "Private answer"
}
HTTP 201
[Captures]
card_id: jsonpath "$.id"

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-b",
  "password": "correct-horse-battery-staple"
}
HTTP 201

GET {{base}}/notes/{{note_id}}
HTTP 403

PUT {{base}}/notes/{{note_id}}
Content-Type: application/json
{
  "title": "Bob cannot edit this",
  "body": ""
}
HTTP 403

DELETE {{base}}/notes/{{note_id}}
HTTP 403

POST {{base}}/cards
Content-Type: application/json
{
  "note_id": "{{note_id}}",
  "front": "Bob cannot create this",
  "back": "No"
}
HTTP 403

GET {{base}}/cards/{{card_id}}
HTTP 403

DELETE {{base}}/cards/{{card_id}}
HTTP 403

POST {{base}}/reviews/{{card_id}}
Content-Type: application/json
{
  "grade": "good"
}
HTTP 403
