# Reviews: a freshly created card is due now, can be graded, and gets rescheduled.
# Intervals are intentionally not pinned here — only that grading moves a card forward.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-r",
  "password": "correct-horse-battery-staple"
}
HTTP 201

POST {{base}}/notes
Content-Type: application/json
{
  "title": "HTTP status 201",
  "body": "Created."
}
HTTP 201
[Captures]
note_id: jsonpath "$.id"

POST {{base}}/cards
Content-Type: application/json
{
  "note_id": "{{note_id}}",
  "front": "What does 201 mean?",
  "back": "Created"
}
HTTP 201
[Captures]
card_id: jsonpath "$.id"

# A new card is due today, so it appears in the queue.
GET {{base}}/reviews/queue
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$[*].id" contains {{card_id}}

# Grade it "good": it should move forward (interval grows, next_due is a date).
POST {{base}}/reviews/{{card_id}}
Content-Type: application/json
{
  "grade": "good"
}
HTTP 201
[Asserts]
jsonpath "$.card_id" == {{card_id}}
jsonpath "$.grade" == "good"
jsonpath "$.interval" >= 1
jsonpath "$.next_due" matches /^\d{4}-\d{2}-\d{2}$/

# Grading moved the card forward, so it must leave today's queue.
# (Only that it left — the interval value stays unpinned.)
GET {{base}}/reviews/queue
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$[*].id" not contains {{card_id}}

# An unknown grade is rejected.
POST {{base}}/reviews/{{card_id}}
Content-Type: application/json
{
  "grade": "perfect"
}
HTTP 422

# Grading a card that does not exist is a 404.
POST {{base}}/reviews/999999
Content-Type: application/json
{
  "grade": "good"
}
HTTP 404
