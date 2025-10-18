from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
from decimal import Decimal
from datetime import datetime, timedelta, date
import jwt

# This is a pure API server.
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-very-secret-key-that-should-be-random-and-long' # IMPORTANT: Change this
CORS(app)

# --- Database Configuration ---
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Mann@2029',
    'database': 'webapp'
}

# --- Database Helper Function ---
def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# --- Helper function to get email from a JWT token ---
def get_email_from_token():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        token = auth_header.split(" ")[1]
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return decoded_token.get('email')
    except Exception as e:
        print(f"Token validation error: {e}")
        return None

# --- API ENDPOINTS ---

@app.route('/')
def index():
    return "<h1>BookNest API is running.</h1>"

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    identifier = data.get('loginIdentifier')
    password = data.get('password').encode('utf-8')
    
    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        user_email = None
        if '@' in identifier:
            user_email = identifier
        else:
            cursor.execute("SELECT Email FROM registration WHERE PhoneNumber = %s", (identifier,))
            user_reg = cursor.fetchone()
            if user_reg:
                user_email = user_reg['Email']

        if not user_email:
            return jsonify({'success': False, 'message': 'Invalid credentials.'}), 401

        cursor.execute("SELECT PasswordHash FROM login WHERE Email = %s", (user_email,))
        login_data = cursor.fetchone()

        if login_data and bcrypt.checkpw(password, login_data['PasswordHash'].encode('utf-8')):
            token = jwt.encode({
                'email': user_email,
                'exp': datetime.utcnow() + timedelta(minutes=10)
            }, app.config['SECRET_KEY'], algorithm="HS256")
            
            return jsonify({'success': True, 'message': 'Login successful!', 'token': token, 'email': user_email})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials.'}), 401
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    email = data.get('email')
    phone_number = data.get('phoneNumber')
    password = data.get('password').encode('utf-8')

    if not all([first_name, last_name, email, phone_number, password]):
        return jsonify({'success': False, 'message': 'Missing required fields.'}), 400

    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())
    
    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database connection error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT * FROM registration WHERE Email = %s OR PhoneNumber = %s", (email, phone_number))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Email or phone number already registered.'}), 409

        cursor.execute("INSERT INTO registration (FirstName, LastName, Email, PhoneNumber) VALUES (%s, %s, %s, %s)",
                       (first_name, last_name, email, phone_number))
        
        cursor.execute("INSERT INTO login (Email, PasswordHash) VALUES (%s, %s)",
                       (email, hashed_password))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Registration successful!'})
    except mysql.connector.Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({'success': False, 'message': 'An error occurred during registration.'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/books', methods=['GET'])
def get_all_books():
    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        query = "SELECT b.ISBN, b.Title, b.Price, b.CoverImageURL, a.Name AS AuthorName FROM book b JOIN author a ON b.AuthorID = a.AuthorID ORDER BY b.Title;"
        cursor.execute(query)
        books = cursor.fetchall()
        for book in books:
            if isinstance(book['Price'], Decimal):
                book['Price'] = str(book['Price'])
        return jsonify({'success': True, 'books': books})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/book/<string:isbn>', methods=['GET'])
def get_book_detail(isbn):
    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        query = """
            SELECT b.*, a.Name AS AuthorName, p.Name AS PublisherName
            FROM book b JOIN author a ON b.AuthorID = a.AuthorID
            LEFT JOIN publisher p ON b.PublisherID = p.PublisherID WHERE b.ISBN = %s;
        """
        cursor.execute(query, (isbn,))
        book = cursor.fetchone()
        if book:
            if isinstance(book.get('Price'), Decimal):
                book['Price'] = str(book['Price'])
            return jsonify({'success': True, 'book': book})
        else:
            return jsonify({'success': False, 'message': 'Book not found.'}), 404
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/add_to_cart', methods=['POST'])
def api_add_to_cart():
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401
    
    data = request.get_json()
    isbn = data.get('isbn')
    quantity = int(data.get('quantity', 1))

    if not isbn:
        return jsonify({'success': False, 'message': 'Book ISBN is required.'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT Price FROM book WHERE ISBN = %s", (isbn,))
        book = cursor.fetchone()
        if not book: return jsonify({'success': False, 'message': 'Book not found.'}), 404
        
        book_price = Decimal(book['Price'])
        total_amount = book_price * quantity
        
        cursor.execute("SELECT OrderID FROM orders WHERE Email = %s AND OrderID NOT IN (SELECT OrderID FROM payment WHERE OrderID IS NOT NULL)", (user_email,))
        active_order = cursor.fetchone()
        
        if active_order:
            order_id = active_order['OrderID']
            cursor.execute("UPDATE orders SET TotalAmount = TotalAmount + %s WHERE OrderID = %s", (total_amount, order_id))
        else:
            cursor.execute(
                "INSERT INTO orders (OrderDate, TotalAmount, Email) VALUES (%s, %s, %s)",
                (date.today(), total_amount, user_email)
            )
            order_id = cursor.lastrowid

        cursor.execute(
            "INSERT INTO orderitem (OrderID, ISBN, Quantity, Price) VALUES (%s, %s, %s, %s)",
            (order_id, isbn, quantity, book_price)
        )
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Book added to cart!'})
    except Exception as e:
        conn.rollback()
        print(f"DATABASE ERROR: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
    
@app.route('/api/cart', methods=['GET'])
def api_get_cart():
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT OrderID FROM orders WHERE Email = %s AND OrderID NOT IN (SELECT OrderID FROM payment WHERE OrderID IS NOT NULL)", (user_email,))
        active_order = cursor.fetchone()

        if not active_order:
            return jsonify({'success': True, 'items': [], 'total': '0.00'})

        order_id = active_order['OrderID']
        
        query = """
            SELECT b.Title, b.CoverImageURL, oi.* FROM orderitem oi
            JOIN book b ON oi.ISBN = b.ISBN 
            WHERE oi.OrderID = %s;
        """
        cursor.execute(query, (order_id,))
        cart_items = cursor.fetchall()
        
        total = sum(Decimal(item['Price']) * item['Quantity'] for item in cart_items)
        for item in cart_items:
            item['Price'] = str(item['Price'])
            
        return jsonify({'success': True, 'items': cart_items, 'total': str(total), 'orderId': order_id})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
        
@app.route('/api/cart/remove/<int:item_id>', methods=['DELETE'])
def api_remove_from_cart(item_id):
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401
        
    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT o.OrderID FROM orders o JOIN orderitem oi ON o.OrderID = oi.OrderID WHERE o.Email = %s AND oi.OrderItemID = %s", (user_email, item_id))
        item_to_delete = cursor.fetchone()

        if not item_to_delete:
            return jsonify({'success': False, 'message': 'Item not found or permission denied.'}), 404

        cursor.execute("DELETE FROM orderitem WHERE OrderItemID = %s", (item_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'Item removed from cart.'})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/checkout', methods=['POST'])
def api_checkout():
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT OrderID FROM orders WHERE Email = %s AND OrderID NOT IN (SELECT OrderID FROM payment WHERE OrderID IS NOT NULL)", (user_email,))
        active_order = cursor.fetchone()

        if not active_order:
            return jsonify({'success': False, 'message': 'Your cart is empty.'}), 400
            
        final_order_id = active_order['OrderID']
        
        return jsonify({'success': True, 'orderId': final_order_id})
    except Exception as e:
        conn.rollback()
        print(f"DATABASE ERROR: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

    # --- ADD THIS NEW FUNCTION TO APP.PY ---

@app.route('/api/create_order_for_payment', methods=['POST'])
def api_create_order_for_payment():
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401
    
    data = request.get_json()
    isbn = data.get('isbn')
    quantity = int(data.get('quantity', 1))

    if not isbn:
        return jsonify({'success': False, 'message': 'Book ISBN is required.'}), 400

    conn = get_db_connection()
    if not conn: 
        return jsonify({'success': False, 'message': 'Database error.'}), 500
    
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        # 1. Get the book's price
        cursor.execute("SELECT Price FROM book WHERE ISBN = %s", (isbn,))
        book = cursor.fetchone()
        if not book: 
            return jsonify({'success': False, 'message': 'Book not found.'}), 404
        
        book_price = Decimal(book['Price'])
        total_amount = book_price * quantity
        
        # 2. Create a new order for this "Buy Now" item
        cursor.execute(
            "INSERT INTO orders (OrderDate, TotalAmount, Email) VALUES (%s, %s, %s)",
            (date.today(), total_amount, user_email)
        )
        
        # 3. Get the ID of the order you just created
        order_id = cursor.lastrowid

        # 4. Add the single item to that new order
        cursor.execute(
            "INSERT INTO orderitem (OrderID, ISBN, Quantity, Price) VALUES (%s, %s, %s, %s)",
            (order_id, isbn, quantity, book_price)
        )
        
        # 5. Commit the transaction
        conn.commit()
        
        # 6. Return the new orderId to the frontend
        return jsonify({'success': True, 'orderId': order_id})
    except Exception as e:
        conn.rollback()
        print(f"DATABASE ERROR (create_order_for_payment): {e}")
        return jsonify({'success': False, 'message': 'Failed to create order.'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- (Rest of your app.py code) ---


@app.route('/api/order/<int:order_id>', methods=['GET'])
def api_get_order(order_id):
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT OrderID, TotalAmount FROM orders WHERE OrderID = %s AND Email = %s", (order_id, user_email))
        order = cursor.fetchone()
        if not order: return jsonify({'success': False, 'message': 'Order not found.'}), 404
        
        order['TotalAmount'] = str(order['TotalAmount'])
        return jsonify({'success': True, 'order': order})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/process_payment', methods=['POST'])
def api_process_payment():
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    data = request.get_json()
    order_id = data.get('orderId')
    total_amount = data.get('totalAmount')

    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT * FROM orders WHERE OrderID = %s AND Email = %s", (order_id, user_email))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Order not found or permission denied.'}), 404
            
        cursor.execute(
            "INSERT INTO payment (OrderID, TotalAmt) VALUES (%s, %s)",
            (order_id, total_amount)
        )
        conn.commit()
        return jsonify({'success': True, 'message': f'Payment for Order #{order_id} successful!'})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            
@app.route('/api/addresses', methods=['GET'])
def get_addresses():
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        cursor.execute("SELECT * FROM user_address WHERE Email = %s", (user_email,))
        addresses = cursor.fetchall()
        return jsonify({'success': True, 'addresses': addresses})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/addresses/add', methods=['POST'])
def add_address():
    user_email = get_email_from_token()
    if not user_email:
        return jsonify({'success': False, 'message': 'Authentication required.'}), 401

    data = request.get_json()
    full_name = data.get('name')
    street_address = data.get('address')
    phone_number = data.get('phone')

    if not all([full_name, street_address, phone_number]):
        return jsonify({'success': False, 'message': 'All address fields are required.'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'success': False, 'message': 'Database error.'}), 500
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute(
            "INSERT INTO user_address (Email, FullName, StreetAddress, PhoneNumber) VALUES (%s, %s, %s, %s)",
            (user_email, full_name, street_address, phone_number)
        )
        conn.commit()
        return jsonify({'success': True, 'message': 'Address saved successfully!'})
    except Exception as e:
        conn.rollback()
        print(f"DATABASE ERROR: {e}")
        return jsonify({'success': False, 'message': 'Failed to save address.'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True)

