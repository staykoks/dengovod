from extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(80), nullable=True)
    avatar = db.Column(db.String(256), nullable=True)
    base_currency = db.Column(db.String(3), default='RUB')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    budgets = db.relationship('Budget', backref='user', lazy=True)
    categories = db.relationship('Category', backref='user', lazy=True)

class Currency(db.Model):
    code = db.Column(db.String(3), primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    symbol = db.Column(db.String(5), nullable=False)

class ExchangeRate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    base_currency = db.Column(db.String(3), nullable=False)
    target_currency = db.Column(db.String(3), nullable=False)
    rate = db.Column(db.Float, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_manual = db.Column(db.Boolean, default=False)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(20), nullable=False) # 'income' or 'expense'
    color = db.Column(db.String(20), default='#3b82f6')
    icon = db.Column(db.String(50), default='Circle')
    parent_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]), lazy=True)
    transactions = db.relationship('Transaction', backref='category', lazy=True)
    budgets = db.relationship('Budget', backref='category', lazy=True)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='RUB')
    description = db.Column(db.String(200), nullable=True)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(10), nullable=False) # 'income' or 'expense'
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    attachment = db.Column(db.String(256), nullable=True)
    tags = db.Column(db.String(256), nullable=True)

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    amount_limit = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), default='month') # month, quarter, year, custom
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    archived = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)