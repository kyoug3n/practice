# Registration creates a user without exposing a password hash.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}",
  "password": "correct-horse-battery-staple"
}
HTTP 201
[Captures]
user_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" exists
jsonpath "$.username" == "{{username}}"
jsonpath "$.created_at" exists
jsonpath "$.password_hash" not exists
header "Set-Cookie" contains "recall_session="
header "Set-Cookie" contains "HttpOnly"
header "Set-Cookie" contains "SameSite=lax"

# A registered user can obtain a fresh session by logging in.
POST {{base}}/auth/login
Content-Type: application/json
{
  "username": "{{username}}",
  "password": "correct-horse-battery-staple"
}
HTTP 200
[Asserts]
jsonpath "$.id" == "{{user_id}}"
jsonpath "$.username" == "{{username}}"
header "Set-Cookie" contains "recall_session="
header "Set-Cookie" contains "HttpOnly"
header "Set-Cookie" contains "SameSite=lax"

# A wrong password never creates a session.
POST {{base}}/auth/login
Content-Type: application/json
{
  "username": "{{username}}",
  "password": "wrong-password"
}
HTTP 401
[Asserts]
header "Set-Cookie" not exists

# Logins are unique.
POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}",
  "password": "another-correct-password"
}
HTTP 409

# Invalid registration input is rejected.
POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "No spaces",
  "password": "short"
}
HTTP 422
