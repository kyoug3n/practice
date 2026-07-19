# A current user requires a valid session cookie.

GET {{base}}/auth/me
HTTP 401

GET {{base}}/auth/me
Cookie: recall_session=invalid
HTTP 401

# Logout is safe even without a session.
POST {{base}}/auth/logout
HTTP 204
[Asserts]
header "Set-Cookie" contains "recall_session="
