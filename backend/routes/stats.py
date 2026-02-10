from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Transaction
from sqlalchemy import func, case, extract
from extensions import db
from datetime import datetime, timedelta
import calendar

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_stats():
    user_id = int(get_jwt_identity())
    
    # Current Date info
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year
    
    # Total Balance (All time)
    income = db.session.query(func.sum(Transaction.amount)).filter_by(user_id=user_id, type='income').scalar() or 0
    expenses = db.session.query(func.sum(Transaction.amount)).filter_by(user_id=user_id, type='expense').scalar() or 0
    balance = income - expenses
    
    # Monthly Income/Expense (Current Month)
    total_income_month = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'income',
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).scalar() or 0

    total_expense_month = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense',
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).scalar() or 0

    # Recent Transactions
    recent = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc()).limit(5).all()
    recent_data = [{
        "id": t.id,
        "amount": t.amount,
        "description": t.description,
        "date": t.date.isoformat(),
        "type": t.type,
        "category": t.category_name
    } for t in recent]

    # Chart Data: Daily breakdown for the current month
    daily_stats = db.session.query(
        extract('day', Transaction.date).label('day'),
        func.sum(case((Transaction.type == 'income', Transaction.amount), else_=0)).label('income'),
        func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('expense')
    ).filter(
        Transaction.user_id == user_id,
        extract('month', Transaction.date) == current_month,
        extract('year', Transaction.date) == current_year
    ).group_by(
        extract('day', Transaction.date)
    ).order_by(
        extract('day', Transaction.date)
    ).all()

    # Create a map for existing data
    data_map = {int(d.day): {"income": float(d.income), "expense": float(d.expense)} for d in daily_stats}

    # Fill in all days of the month (1 to last day)
    _, last_day = calendar.monthrange(current_year, current_month)
    chart_data = []
    
    for day in range(1, last_day + 1):
        day_data = data_map.get(day, {"income": 0, "expense": 0})
        chart_data.append({
            "name": str(day), # Frontend X-axis label
            "income": day_data["income"],
            "expense": day_data["expense"]
        })

    return jsonify({
        "balance": balance,
        "income": total_income_month, # Showing monthly stats on cards now
        "expenses": total_expense_month,
        "total_income": total_income_month, # Added for consistency if frontend uses it
        "total_expenses": total_expense_month,
        "recent_transactions": recent_data,
        "chart_data": chart_data,
        "currency": "RUB" # Default, ideally fetched from user
    }), 200