# A cross-origin form cannot mutate a cookie-authenticated workspace.

POST {{base}}/auth/register
Content-Type: application/json
{
  "username": "{{username}}-x",
  "password": "correct-horse-battery-staple"
}
HTTP 201

POST {{base}}/notes
Origin: https://untrusted.example
Content-Type: application/x-www-form-urlencoded
[FormParams]
title: Cross-site note
body: forbidden
tags:
links:
HTTP 403
[Asserts]
jsonpath "$.error" == "недопустимый источник запроса"

# The configured frontend origin remains allowed for mutations.
POST {{base}}/notes
Origin: {{frontend}}
Content-Type: application/json
{
  "title": "Trusted note",
  "body": "allowed",
  "tags": [],
  "links": []
}
HTTP 201
