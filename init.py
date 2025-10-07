from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    # Import blueprints
    from app.routes import auth, books, cart, orders
    app.register_blueprint(auth.bp, url_prefix="/api/auth")
    app.register_blueprint(books.bp, url_prefix="/api/books")
    app.register_blueprint(cart.bp, url_prefix="/api/cart")
    app.register_blueprint(orders.bp, url_prefix="/api/orders")

    return app
