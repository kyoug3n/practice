# Browser cookies require an explicit, trusted frontend origin.

OPTIONS {{base}}/auth/me
Origin: {{frontend}}
Access-Control-Request-Method: GET
HTTP 204
[Asserts]
header "Access-Control-Allow-Origin" == "{{frontend}}"
header "Access-Control-Allow-Credentials" == "true"
header "Access-Control-Allow-Methods" contains "GET"
header "Vary" contains "Origin"

# Other origins do not receive CORS permission.
OPTIONS {{base}}/auth/me
Origin: https://untrusted.example
Access-Control-Request-Method: GET
HTTP 204
[Asserts]
header "Access-Control-Allow-Origin" not exists
header "Access-Control-Allow-Credentials" not exists
