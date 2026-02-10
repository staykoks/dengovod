from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Category, Transaction
from extensions import db

cat_bp = Blueprint('categories', __name__)

@cat_bp.route('/', methods=['GET'])
@jwt_required()
def get_categories():
    user_id = int(get_jwt_identity())
    categories = Category.query.filter((Category.user_id == user_id) | (Category.user_id == None)).all()
    
    result = []
    for c in categories:
        result.append({
            "id": c.id,
            "name": c.name,
            "type": c.type,
            "color": c.color,
            "icon": c.icon,
            "parent_id": c.parent_id,
            "is_system": c.user_id is None
        })
    return jsonify(result), 200

@cat_bp.route('/', methods=['POST'])
@jwt_required()
def add_category():
    user_id = int(get_jwt_identity())
    
    # Robust data retrieval (handles JSON or Form Data)
    data = request.get_json(silent=True)
    if not data:
        data = request.form.to_dict()
    
    if not data:
        return jsonify({"msg": "No data provided"}), 400
    
    name = data.get('name')
    if not name:
        return jsonify({"msg": "Name is required"}), 400
        
    # Handle nullable parent_id safely
    parent_id = data.get('parent_id')
    if parent_id == "" or parent_id == "null":
        parent_id = None
    
    new_cat = Category(
        name=name,
        type=data.get('type', 'expense'),
        color=data.get('color', '#000000'),
        icon=data.get('icon', 'Circle'),
        parent_id=parent_id,
        user_id=user_id
    )
    db.session.add(new_cat)
    db.session.commit()
    return jsonify({"msg": "Category created", "id": new_cat.id}), 201

@cat_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_category(id):
    user_id = int(get_jwt_identity())
    cat = Category.query.filter_by(id=id, user_id=user_id).first_or_404()
    
    # Check if used
    if Transaction.query.filter_by(category_id=id).first():
        return jsonify({"msg": "Cannot delete category with transactions"}), 400
        
    if Category.query.filter_by(parent_id=id).first():
        return jsonify({"msg": "Cannot delete category with sub-categories"}), 400

    db.session.delete(cat)
    db.session.commit()
    return jsonify({"msg": "Deleted"}), 200
