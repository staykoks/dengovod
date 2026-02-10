from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Transaction, Category, User
from extensions import db
from datetime import datetime
import os
import uuid
from routes.currencies import get_conversion_rate

trans_bp = Blueprint('transactions', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_all_child_ids(parent_id):
    """Recursively fetch all child category IDs."""
    ids = [parent_id]
    children = Category.query.filter_by(parent_id=parent_id).all()
    for child in children:
        ids.extend(get_all_child_ids(child.id))
    return ids

@trans_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    base_currency = user.base_currency or 'RUB'
    
    query = Transaction.query.filter_by(user_id=user_id)
    
    # Filters
    t_type = request.args.get('type')
    if t_type and t_type != 'all':
        query = query.filter_by(type=t_type)
        
    category_id = request.args.get('category_id')
    if category_id:
        try:
            cat_id_int = int(category_id)
            # Recursive filter
            cat_ids = get_all_child_ids(cat_id_int)
            query = query.filter(Transaction.category_id.in_(cat_ids))
        except ValueError:
            pass # Invalid ID format
        
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
        
    search = request.args.get('search')
    if search:
        query = query.filter(Transaction.description.ilike(f'%{search}%'))

    transactions = query.order_by(Transaction.date.desc()).all()
    
    result = []
    rate_cache = {}
    
    for t in transactions:
        cat = Category.query.get(t.category_id)
        
        # Calculate amount in User's Base Currency
        amount_in_base = t.amount
        if t.currency != base_currency:
             k = f"{t.currency}_{base_currency}"
             if k not in rate_cache:
                 rate_cache[k] = get_conversion_rate(t.currency, base_currency)
             amount_in_base = t.amount * rate_cache[k]

        result.append({
            "id": t.id,
            "amount": t.amount,
            "currency": t.currency,
            "amount_in_base": round(amount_in_base, 2),
            "base_currency": base_currency,
            "description": t.description,
            "date": t.date.isoformat(),
            "type": t.type,
            "category_id": t.category_id,
            "category_name": cat.name if cat else "Unknown",
            "category_color": cat.color if cat else "#000000",
            "tags": t.tags,
            "attachment": t.attachment
        })
    return jsonify(result), 200

@trans_bp.route('/', methods=['POST'])
@jwt_required()
def add_transaction():
    user_id = int(get_jwt_identity())
    file = None
    
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
        if 'file' in request.files:
            file = request.files['file']

    amount = data.get('amount')
    desc = data.get('description')
    date_str = data.get('date')
    t_type = data.get('type')
    cat_id = data.get('category_id')
    currency = data.get('currency', 'RUB')
    tags = data.get('tags', '')

    try:
        if date_str:
            # Handle potential Z suffix
            date_str = date_str.replace('Z', '+00:00')
            txn_date = datetime.fromisoformat(date_str)
        else:
            txn_date = datetime.utcnow()
    except:
        txn_date = datetime.utcnow()

    filename = None
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        file.save(os.path.join(upload_folder, filename))

    new_trans = Transaction(
        amount=float(amount),
        description=desc,
        date=txn_date,
        type=t_type,
        category_id=cat_id,
        user_id=user_id,
        currency=currency.upper(),
        tags=tags,
        attachment=filename
    )
    db.session.add(new_trans)
    db.session.commit()
    return jsonify({"msg": "Transaction added", "id": new_trans.id}), 201

@trans_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_transaction(id):
    user_id = int(get_jwt_identity())
    trans = Transaction.query.filter_by(id=id, user_id=user_id).first_or_404()
    
    data = request.get_json(silent=True) or request.form.to_dict()
    
    if 'amount' in data: trans.amount = float(data['amount'])
    if 'description' in data: trans.description = data['description']
    if 'category_id' in data: trans.category_id = data['category_id']
    if 'currency' in data: trans.currency = data['currency'].upper()
    if 'date' in data and data['date']: 
         try:
            trans.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
         except: pass
    
    db.session.commit()
    return jsonify({"msg": "Transaction updated"}), 200

@trans_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(id):
    user_id = int(get_jwt_identity())
    trans = Transaction.query.filter_by(id=id, user_id=user_id).first_or_404()
    if trans.attachment:
        path = os.path.join(current_app.root_path, 'static', 'uploads', trans.attachment)
        if os.path.exists(path):
            try: os.remove(path)
            except: pass
    db.session.delete(trans)
    db.session.commit()
    return jsonify({"msg": "Deleted"}), 200
