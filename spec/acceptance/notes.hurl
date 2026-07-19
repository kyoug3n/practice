# Notes: create, read, update, filter by tag, delete.
# Loose by design — asserts observable behaviour, not internal representation.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-n",
  "password": "correct-horse-battery-staple"
}
HTTP 201

# Create a note.
POST {{base}}/notes
Content-Type: application/json
{
  "title": "Forgetting curve",
  "body": "Memory decays unless refreshed.",
  "tags": ["memory", "learning"]
}
HTTP 201
[Captures]
note_id: jsonpath "$.id"
[Asserts]
jsonpath "$.title" == "Forgetting curve"
jsonpath "$.tags" contains "memory"
jsonpath "$.created_at" exists

# Read it back.
GET {{base}}/notes/{{note_id}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{note_id}}
jsonpath "$.body" == "Memory decays unless refreshed."

# Update it.
PUT {{base}}/notes/{{note_id}}
Content-Type: application/json
{
  "title": "Forgetting curve (Ebbinghaus)",
  "body": "Memory decays unless refreshed.",
  "tags": ["memory"]
}
HTTP 200
[Asserts]
jsonpath "$.title" == "Forgetting curve (Ebbinghaus)"

# Filter notes by an existing tag.
GET {{base}}/notes?tag=memory
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$[*].id" contains {{note_id}}

# Validation: a note needs a title.
POST {{base}}/notes
Content-Type: application/json
{
  "body": "no title here"
}
HTTP 422

# Delete it.
DELETE {{base}}/notes/{{note_id}}
HTTP 204

# Now it is gone.
GET {{base}}/notes/{{note_id}}
HTTP 404
