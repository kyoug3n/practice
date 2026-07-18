# A current user requires a valid session cookie.

GET {{base}}/auth/me
HTTP 401

GET {{base}}/auth/me
Cookie: recall_session=invalid
HTTP 401
