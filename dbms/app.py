from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
from decimal import Decimal

# This is now a pure API server. No template/static configuration is needed.
app = Flask(__name__)
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

# --- Root Route to confirm API is running ---
@app.route('/')
def index():
    """Confirms that the backend server is running."""
    return "<h1>BookNest API is running.</h1>"

# --- API ENDPOINTS (FOR DATA) ---
# ... (Your existing API endpoints for books remain here) ...
@app.route('/api/books', methods=['GET'])
def get_all_books():
    """API endpoint that returns all books as JSON."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error.'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT b.ISBN, b.Title, b.Price, b.CoverImageURL, a.Name AS AuthorName 
            FROM book b JOIN author a ON b.AuthorID = a.AuthorID ORDER BY b.Title;
        """
        cursor.execute(query)
        books = cursor.fetchall()
        # Convert Decimal type to string for JSON compatibility
        for book in books:
            if isinstance(book['Price'], Decimal):
                book['Price'] = str(book['Price'])
        return jsonify({'success': True, 'books': books})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/book/<string:isbn>', methods=['GET'])
def get_book_detail(isbn):
    """API endpoint that returns details for a single book by its ISBN."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error.'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                b.ISBN, b.Title, b.Year, b.Price, b.CoverImageURL, b.Description,
                a.Name AS AuthorName,
                p.Name AS PublisherName
            FROM book b
            JOIN author a ON b.AuthorID = a.AuthorID
            LEFT JOIN publisher p ON b.PublisherID = p.PublisherID
            WHERE b.ISBN = %s;
        """
        cursor.execute(query, (isbn,))
        book = cursor.fetchone()
        
        if book:
            if isinstance(book.get('Price'), Decimal):
                book['Price'] = str(book['Price'])
            return jsonify({'success': True, 'book': book})
        else:
            return jsonify({'success': False, 'message': 'Book not found.'}), 404

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# --- API Endpoint for Registration ---
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    email = data.get('email')
    phone_number = data.get('phoneNumber')
    password = data.get('password').encode('utf-8')

    # --- START OF DIAGNOSTIC PRINTS ---
    print("\n--- REGISTRATION ATTEMPT ---")
    print(f"Received data: {data}")
    # --- END OF DIAGNOSTIC PRINTS ---

    if not all([first_name, last_name, email, phone_number, password]):
        return jsonify({'success': False, 'message': 'Missing required fields.'}), 400

    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error.'}), 500
        
    cursor = conn.cursor(dictionary=True)
    try:
        print("Checking if user exists...")
        cursor.execute("SELECT * FROM registration WHERE Email = %s OR PhoneNumber = %s", (email, phone_number))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("User already exists.")
            print("--- END REGISTRATION ATTEMPT ---\n")
            return jsonify({'success': False, 'message': 'Email or phone number already registered.'}), 409

        print("User does not exist. Proceeding with registration.")
        print("Inserting into 'registration' table...")
        cursor.execute("INSERT INTO registration (FirstName, LastName, Email, PhoneNumber) VALUES (%s, %s, %s, %s)",
                       (first_name, last_name, email, phone_number))
        
        print("Inserting into 'login' table...")
        # THE FIX IS HERE: The INSERT statement now matches your 'login' table schema.
        cursor.execute("INSERT INTO login (Email, PasswordHash) VALUES (%s, %s)",
                       (email, hashed_password))
        
        print("Committing changes to the database...")
        conn.commit()
        print("Registration successful.")
        print("--- END REGISTRATION ATTEMPT ---\n")
        return jsonify({'success': True, 'message': 'Registration successful!'})

    except mysql.connector.Error as e:
        conn.rollback()
        # This will now print the specific SQL error to your terminal
        print(f"!!! DATABASE ERROR: {e} !!!")
        print("--- END REGISTRATION ATTEMPT ---\n")
        return jsonify({'success': False, 'message': 'An error occurred during registration.'}), 500
    finally:
        cursor.close()
        conn.close()

# --- API Endpoint for Login ---
@app.route('/api/login', methods=['POST'])
def api_login():
    # ... (Your existing login code with diagnostics remains here)
    data = request.get_json()
    identifier = data.get('loginIdentifier')
    password = data.get('password').encode('utf-8')

    print("\n--- LOGIN ATTEMPT ---")
    print(f"Received Identifier: {identifier}")

    if not identifier or not password:
        return jsonify({'success': False, 'message': 'Missing credentials.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        user_email = None
        if '@' in identifier:
            user_email = identifier
            print(f"Identifier is an email.")
        else:
            print(f"Identifier is a phone number. Looking up email...")
            cursor.execute("SELECT Email FROM registration WHERE PhoneNumber = %s", (identifier,))
            user_reg = cursor.fetchone()
            if user_reg:
                user_email = user_reg['Email']
                print(f"Found corresponding email: {user_email}")
            else:
                print("No user found with that phone number.")

        if not user_email:
            print("Could not determine user email.")
            return jsonify({'success': False, 'message': 'Invalid credentials.'}), 401

        cursor.execute("SELECT PasswordHash FROM login WHERE Email = %s", (user_email,))
        login_data = cursor.fetchone()

        if login_data:
            print("Found user in login table.")
            stored_hash = login_data['PasswordHash'].encode('utf-8')
            if bcrypt.checkpw(password, stored_hash):
                print("Password MATCHES.")
                return jsonify({'success': True, 'message': 'Login successful!'})
            else:
                print("Password DOES NOT MATCH.")
        else:
            print("User email not found in login table.")
        
        return jsonify({'success': False, 'message': 'Invalid credentials.'}), 401
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    app.run(debug=True)

