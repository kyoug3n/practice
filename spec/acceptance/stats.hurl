# Stats: shape and basic monotonicity only.
# The exact counting rules are part of the task, so they are not pinned here.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-s",
  "password": "correct-horse-battery-staple"
}
HTTP 201

GET {{base}}/stats
HTTP 200
[Asserts]
jsonpath "$.due_today" isInteger
jsonpath "$.due_today" >= 0
jsonpath "$.due_week" isInteger
jsonpath "$.due_week" >= 0
jsonpath "$.streak" isInteger
jsonpath "$.streak" >= 0
