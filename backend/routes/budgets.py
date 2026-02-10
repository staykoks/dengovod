from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Budget, Category, Transaction, User
from extensions import db
from sqlalchemy import func, extract
from datetime import datetime
from routes.currencies import get_conversion_rate

budget_bp = Blueprint('budgets', __name__)

@budget_bp.route('/', methods=['GET'])
@jwt_required()
def get_budgets():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    base_currency = user.base_currency

    show_archived = request.args.get('archived') == 'true'
    query = Budget.query.filter_by(user_id=user_id)
    if not show_archived:
        query = query.filter_by(archived=False)
        
    budgets = query.all()
    
    result = []
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year

    # Cache rates to avoid repetitive API calls
    rate_cache = {}

    for b in budgets:
        # 1. Find all relevant category IDs (Parent + Children)
        # Simple recursion for 1-level deep or flat query if structure allows.
        # Here we do a query to find immediate children. 
        # For deeper trees, a recursive CTE or recursive python function is needed.
        # Assuming 1-2 levels for simplicity or fetch all cats and filter.
        
        child_cats = Category.query.filter_by(parent_id=b.category_id).all()
        cat_ids = [b.category_id] + [c.id for c in child_cats]
        
        # 2. Fetch transactions
        # We must fetch them to convert currency in Python code
        # SQL Sum is not enough because transactions can be in different currencies
        txns = Transaction.query.filter(
            Transaction.category_id.in_(cat_ids),
            Transaction.user_id == user_id,
            extract('month', Transaction.date) == current_month,
            extract('year', Transaction.date) == current_year
        ).all()
        
        spent = 0
        for t in txns:
            # Convert if needed
            if t.currency != base_currency:
                k = f"{t.currency}_{base_currency}"
                if k not in rate_cache:
                    rate_cache[k] = get_conversion_rate(t.currency, base_currency)
                spent += t.amount * rate_cache[k]
            else:
                spent += t.amount

        cat = Category.query.get(b.category_id)
        
        result.append({
            "id": b.id,
            "category_name": cat.name if cat else "Unknown",
            "limit": b.amount_limit,
            "spent": round(spent, 2),
            "remaining": round(b.amount_limit - spent, 2),
            "percentage": (spent / b.amount_limit) * 100 if b.amount_limit > 0 else 100,
            "period": b.period,
            "archived": b.archived
        })
        
    return jsonify(result), 200

@budget_bp.route('/', methods=['POST'])
@jwt_required()
def add_budget():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data: return jsonify({"msg": "No data"}), 400
    
    cat_id = data.get('category_id')
    amount_limit = data.get('limit')
    
    if not cat_id or not amount_limit:
        return jsonify({"msg": "Required fields missing"}), 400

    existing = Budget.query.filter_by(user_id=user_id, category_id=cat_id, archived=False).first()
    if existing: return jsonify({"msg": "Budget exists"}), 400
    
    budget = Budget(
        category_id=cat_id,
        amount_limit=float(amount_limit),
        period=data.get('period', 'month'),
        user_id=user_id
    )
    db.session.add(budget)
    db.session.commit()
    return jsonify({"msg": "Budget created"}), 201

@budget_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_budget(id):
    user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=id, user_id=user_id).first_or_404()
    data = request.get_json(silent=True) or request.form.to_dict()
    
    if 'limit' in data: budget.amount_limit = float(data['limit'])
    if 'archived' in data: budget.archived = bool(data['archived'])
    if 'period' in data: budget.period = data['period']
    
    db.session.commit()
    return jsonify({"msg": "Updated"}), 200

@budget_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_budget(id):
    user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=id, user_id=user_id).first_or_404()
    db.session.delete(budget)
    db.session.commit()
    return jsonify({"msg": "Deleted"}), 200
