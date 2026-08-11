"""
utils/auth_utils.py
---------------------------------------------------------
Two decorators used to protect routes:

  @login_required        -> must be logged in (any role)
  @role_required('recruiter', 'admin')
                          -> must be logged in AND have one
                             of the given roles

Both rely on Flask's `session`, a signed cookie that Flask
reads/writes automatically. Because it's *signed* (using
app.config['SECRET_KEY']), the browser can't forge or edit
it undetected — it can only send back exactly what the
server gave it.
"""
from functools import wraps

from flask import session, jsonify


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "authentication required"}), 401
        return view(*args, **kwargs)

    return wrapped


def role_required(*allowed_roles):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"error": "authentication required"}), 401
            if session.get("role") not in allowed_roles:
                return jsonify({"error": "you don't have permission to do that"}), 403
            return view(*args, **kwargs)

        return wrapped

    return decorator
