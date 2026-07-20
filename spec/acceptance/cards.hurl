# Cards: created from a note, then read and listed.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-c",
  "password": "correct-horse-battery-staple"
}
HTTP 201

# A card needs a note.
POST {{base}}/notes
Content-Type: application/json
{
  "title": "Capital of France",
  "body": "Paris."
}
HTTP 201
[Captures]
note_id: jsonpath "$.id"

# Create a card from that note.
POST {{base}}/cards
Content-Type: application/json
{
  "note_id": "{{note_id}}",
  "front": "Capital of France?",
  "back": "Paris"
}
HTTP 201
[Captures]
card_id: jsonpath "$.id"
[Asserts]
jsonpath "$.note_id" == {{note_id}}
jsonpath "$.front" == "Capital of France?"
jsonpath "$.interval" isInteger
jsonpath "$.due" matches /^\d{4}-\d{2}-\d{2}$/

# Read it back.
GET {{base}}/cards/{{card_id}}
HTTP 200
[Asserts]
jsonpath "$.back" == "Paris"

# Update the card text.
PUT {{base}}/cards/{{card_id}}
Content-Type: application/json
{
  "note_id": "{{note_id}}",
  "front": "Updated capital question",
  "back": "Updated Paris"
}
HTTP 200
[Asserts]
jsonpath "$.front" == "Updated capital question"
jsonpath "$.back" == "Updated Paris"

# It shows up in the list.
GET {{base}}/cards
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$[*].id" contains {{card_id}}

# Delete the card.
DELETE {{base}}/cards/{{card_id}}
HTTP 204

GET {{base}}/cards/{{card_id}}
HTTP 404

# A card needs an existing note.
POST {{base}}/cards
Content-Type: application/json
{
  "note_id": 999999,
  "front": "x",
  "back": "y"
}
HTTP 404
