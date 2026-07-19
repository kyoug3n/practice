# Health is public and includes a database probe.

GET {{base}}/health
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.database" == "ok"
