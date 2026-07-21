# A public profile contains achievements but never private learning content.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-p",
  "password": "correct-horse-battery-staple"
}
HTTP 201

POST {{base}}/notes
Content-Type: application/json
{
  "title": "Private note",
  "body": "This must not appear in the profile."
}
HTTP 201
[Captures]
note_id: jsonpath "$.id"

POST {{base}}/cards
Content-Type: application/json
{
  "note_id": "{{note_id}}",
  "front": "Question",
  "back": "Answer"
}
HTTP 201
[Captures]
card_id: jsonpath "$.id"

POST {{base}}/reviews/{{card_id}}
Content-Type: application/json
{
  "grade": "good"
}
HTTP 201

POST {{base}}/reviews/{{card_id}}
Content-Type: application/json
{
  "grade": "again"
}
HTTP 201

POST {{base}}/auth/logout
HTTP 204

GET {{base}}/users/{{username}}-p
HTTP 200
[Asserts]
jsonpath "$.username" == "{{username}}-p"
jsonpath "$.created_at" exists
jsonpath "$.cards_count" == 1
jsonpath "$.reviews_count" == 1
jsonpath "$.practice_days" == 1
jsonpath "$.current_streak" >= 1
jsonpath "$.longest_streak" >= 1
jsonpath "$.password_hash" not exists
jsonpath "$.notes" not exists
jsonpath "$.cards" not exists

GET {{base}}/users/unknown-profile
HTTP 404
