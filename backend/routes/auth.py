from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    identifier = data.get('emailOrUsername')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()

    if not user:
        return jsonify({"error": "User not found. Please register first."}), 404

    if not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid password"}), 401

    return jsonify({
        "message": "Login successful",
        "username": user.username,
        "email": user.email,
        "profileExists": user.profile is not None
    }), 200

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Missing registration fields"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists. Please choose another."}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered. Try logging in."}), 409

    hashed_pw = generate_password_hash(password)
    new_user = User(username=username, email=email, password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "Registration successful",
        "username": username,
        "email": email,
        "profileExists": False
    }), 201
