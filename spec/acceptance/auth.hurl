# Registration creates a user without exposing a password hash.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "reader_01",
  "password": "correct-horse-battery-staple"
}
HTTP 201
[Captures]
user_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" exists
jsonpath "$.username" == "reader_01"
jsonpath "$.created_at" exists
jsonpath "$.password_hash" not exists

# Logins are unique.
POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "reader_01",
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
