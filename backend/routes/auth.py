from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User
from extensions import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already registered"}), 400
    
    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        name=data.get('name', '')
    )
    db.session.add(user)
    db.session.commit()
    
    # Cast user.id to string for JWT compliance
    token = create_access_token(identity=str(user.id))
    return jsonify({
        "token": token, 
        "user": {
            "email": user.email, 
            "name": user.name,
            "currency": user.base_currency,
            "avatar": user.avatar
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        # Cast user.id to string for JWT compliance
        token = create_access_token(identity=str(user.id))
        return jsonify({
            "token": token, 
            "user": {
                "email": user.email, 
                "name": user.name,
                "currency": user.base_currency,
                "avatar": user.avatar
            }
        }), 200
        
    return jsonify({"msg": "Invalid credentials"}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    return jsonify({
        "email": user.email, 
        "name": user.name,
        "currency": user.base_currency,
        "avatar": user.avatar
    }), 200