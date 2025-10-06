from flask import Blueprint, request, jsonify
from app.db import get_conn
from app.utils import rows_to_list, row_to_dict
import traceback

bp = Blueprint("books", __name__)

@bp.route("", methods=["GET"])
def get_books():
    try:
        q = (request.args.get("q") or "").strip()
        conn = get_conn()
        cur = conn.cursor()
        if q:
            like = f"%{q}%"
            cur.execute("SELECT BookID, Title, Author, Genre, Price, Stock, ImageURL, Description FROM books WHERE Title LIKE %s OR Author LIKE %s LIMIT 100", (like,like))
        else:
            cur.execute("SELECT BookID, Title, Author, Genre, Price, Stock, ImageURL, Description FROM books ORDER BY BookID DESC LIMIT 1000")
        books = rows_to_list(cur)
        cur.close(); conn.close()
        return jsonify(books)
    except Exception:
        traceback.print_exc()
        return jsonify([]), 500

@bp.route("/<int:book_id>", methods=["GET"])
def get_book(book_id):
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT BookID, Title, Author, Genre, Price, Stock, ImageURL, Description FROM books WHERE BookID=%s", (book_id,))
        book = row_to_dict(cur)
        cur.close(); conn.close()
        if not book:
            return jsonify({}), 404
        return jsonify(book)
    except Exception:
        traceback.print_exc()
        return jsonify({}), 500
