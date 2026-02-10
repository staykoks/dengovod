from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Transaction, Category, User
from sqlalchemy import func, extract
from extensions import db
from datetime import datetime, timedelta
from routes.currencies import get_conversion_rate
import calendar

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        base_currency = user.base_currency or 'RUB'
        
        # Filters
        period = request.args.get('period', 'year')
        group_by_param = request.args.get('group_by', 'month')
        cat_filter = request.args.get('category_id')

        query = Transaction.query.filter_by(user_id=user_id)
        
        # Logic: If category selected, include its children
        if cat_filter and cat_filter.strip():
            try:
                parent_id = int(cat_filter)
                # Helper for recursive IDs could be shared, but simple approach here:
                # For now, just 1 level deep to avoid circular dependencies if not importing from transactions
                children = Category.query.filter_by(parent_id=parent_id).all()
                cat_ids = [parent_id] + [c.id for c in children]
                query = query.filter(Transaction.category_id.in_(cat_ids))
            except:
                pass

        now = datetime.utcnow()
        
        if period == 'month':
            query = query.filter(extract('month', Transaction.date) == now.month, extract('year', Transaction.date) == now.year)
        elif period == 'year':
            query = query.filter(extract('year', Transaction.date) == now.year)
        
        transactions = query.order_by(Transaction.date.asc()).all()
        
        total_income = 0
        total_expenses = 0
        
        chart_data_map = {} 
        cat_totals = {} 

        rate_cache = {}

        for t in transactions:
            # Currency Conversion
            try:
                if t.currency != base_currency:
                    k = f"{t.currency}_{base_currency}"
                    if k not in rate_cache:
                        rate_cache[k] = get_conversion_rate(t.currency, base_currency)
                    amount = t.amount * rate_cache[k]
                else:
                    amount = t.amount
            except Exception as e:
                # Fallback on error: treat as 1:1 to prevent crash
                amount = t.amount
                print(f"Conversion failed for txn {t.id}: {e}")
                
            if t.type == 'income':
                total_income += amount
            else:
                total_expenses += amount
                
                cat_name = t.category.name if t.category else "Unknown"
                cat_color = t.category.color if t.category else "#ccc"
                if cat_name not in cat_totals:
                    cat_totals[cat_name] = {'value': 0, 'color': cat_color}
                cat_totals[cat_name]['value'] += amount

            # Grouping
            if group_by_param == 'day':
                key = t.date.strftime('%d %b')
                sort_key = t.date.strftime('%Y%m%d')
            else:
                key = t.date.strftime('%b %Y')
                sort_key = t.date.strftime('%Y%m')

            if key not in chart_data_map:
                chart_data_map[key] = {'name': key, 'income': 0, 'expense': 0, 'sort': sort_key}
            
            if t.type == 'income':
                chart_data_map[key]['income'] += amount
            else:
                chart_data_map[key]['expense'] += amount

        sorted_chart_data = sorted(chart_data_map.values(), key=lambda x: x['sort'])
        
        pie_data_list = [{"name": k, "value": v['value'], "color": v['color']} for k,v in cat_totals.items()]
        pie_data_list.sort(key=lambda x: x['value'], reverse=True)

        recent_txns = []
        for t in reversed(transactions[-20:]): 
            if t.currency != base_currency:
                k = f"{t.currency}_{base_currency}"
                amt = t.amount * rate_cache.get(k, 1.0)
            else:
                amt = t.amount
                
            recent_txns.append({
                "id": t.id,
                "date": t.date,
                "category_name": t.category.name if t.category else "Unknown",
                "description": t.description,
                "amount": amt,
                "type": t.type,
                "original_amount": t.amount,
                "original_currency": t.currency
            })

        return jsonify({
            "currency": base_currency,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "balance": total_income - total_expenses,
            "pie_data": pie_data_list[:10],
            "bar_data": sorted_chart_data,
            "recent": recent_txns
        }), 200
        
    except Exception as e:
        print(f"Analytics Error: {e}")
        return jsonify({"msg": "Internal Server Error", "error": str(e)}), 500
