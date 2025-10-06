from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.db import get_conn
from app.utils import row_to_dict
import traceback

bp = Blueprint("auth", __name__)

@bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not name or not email or not password:
            return jsonify({"status":"error","message":"Missing fields"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT UserID FROM users WHERE Email=%s", (email,))
        if cur.fetchone():
            cur.close(); conn.close()
            return jsonify({"status":"error","message":"Email already registered"}), 400

        hashed = generate_password_hash(password)
        cur.execute("INSERT INTO users (Name, Email, Password) VALUES (%s,%s,%s)", (name,email,hashed))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"status":"success","message":"User registered"}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status":"error","message":str(e)}), 500

@bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"status":"error","message":"Missing email or password"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT UserID, Name, Email, Password, Address FROM users WHERE Email=%s", (email,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return jsonify({"status":"error","message":"User not found"}), 404

        user = {"UserID": row[0], "Name": row[1], "Email": row[2], "Password": row[3], "Address": row[4]}
        if check_password_hash(user["Password"], password):
            user.pop("Password", None)
            return jsonify({"status":"success","user":user})
        else:
            return jsonify({"status":"error","message":"Wrong password"}), 401
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status":"error","message":str(e)}), 500
