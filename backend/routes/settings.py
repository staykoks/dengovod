from flask import Blueprint, request, jsonify, make_response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Transaction, Category, Budget
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import csv
import io
import os
import uuid
from datetime import datetime
from routes.currencies import get_conversion_rate
from fpdf import FPDF

settings_bp = Blueprint('settings', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg'}

# Dictionary for PDF translations
PDF_TRANSLATIONS = {
    'en': {
        'title': 'Financial Report',
        'page': 'Page',
        'user': 'User',
        'date': 'Date',
        'period': 'Period',
        'col_date': 'Date',
        'col_cat': 'Category',
        'col_type': 'Type',
        'col_desc': 'Description',
        'col_sum': 'Sum',
        'total_inc': 'Total Income',
        'total_exp': 'Total Expenses',
        'net': 'Net Balance',
        'income': 'Income',
        'expense': 'Expense'
    },
    'ru': {
        'title': 'Финансовый отчет',
        'page': 'Страница',
        'user': 'Пользователь',
        'date': 'Дата',
        'period': 'Период',
        'col_date': 'Дата',
        'col_cat': 'Категория',
        'col_type': 'Тип',
        'col_desc': 'Описание',
        'col_sum': 'Сумма',
        'total_inc': 'Общий доход',
        'total_exp': 'Общий расход',
        'net': 'Нетто баланс',
        'income': 'Доход',
        'expense': 'Расход'
    }
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@settings_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json()
    
    if 'name' in data: 
        user.name = data['name']
    
    # Handle Currency Switch with Budget Recalculation
    if 'base_currency' in data and data['base_currency'] != user.base_currency:
        old_currency = user.base_currency
        new_currency = data['base_currency']
        
        # 1. Get conversion rate
        rate = get_conversion_rate(old_currency, new_currency)
        
        # 2. Update all budgets
        budgets = Budget.query.filter_by(user_id=user_id).all()
        for b in budgets:
            b.amount_limit = b.amount_limit * rate
            
        # 3. Update User
        user.base_currency = new_currency
    
    if 'new_password' in data and data['new_password']:
        if not data.get('old_password'):
             return jsonify({"msg": "Old password required to set new password"}), 400
        
        if not check_password_hash(user.password_hash, data['old_password']):
             return jsonify({"msg": "Incorrect old password"}), 400
             
        user.password_hash = generate_password_hash(data['new_password'])
        
    db.session.commit()
    return jsonify({
        "msg": "Profile updated", 
        "user": {
            "name": user.name, 
            "email": user.email, 
            "currency": user.base_currency,
            "avatar": user.avatar
        }
    }), 200

def handle_file_upload(user, file, field_name):
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{field_name}_{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        # Remove old file if exists
        old_filename = getattr(user, field_name)
        if old_filename:
            old_path = os.path.join(upload_folder, old_filename)
            if os.path.exists(old_path):
                try: os.remove(old_path)
                except: pass

        file.save(os.path.join(upload_folder, filename))
        setattr(user, field_name, filename)
        db.session.commit()
        return filename
    return None

@settings_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if 'file' not in request.files: return jsonify({"msg": "No file"}), 400
    file = request.files['file']
    
    filename = handle_file_upload(user, file, 'avatar')
    if filename:
        return jsonify({"msg": "Avatar updated", "avatar": filename}), 200
    return jsonify({"msg": "Invalid file type"}), 400

@settings_bp.route('/import', methods=['POST'])
@jwt_required()
def import_csv():
    user_id = int(get_jwt_identity())
    
    if 'file' not in request.files:
        return jsonify({"msg": "No file uploaded"}), 400
        
    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({"msg": "File must be CSV"}), 400
        
    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    csv_input = csv.DictReader(stream)
    
    count = 0
    errors = 0
    
    for row in csv_input:
        try:
            cat_name = row.get('Category')
            category = Category.query.filter_by(name=cat_name, user_id=user_id).first()
            if not category:
                category = Category.query.filter_by(name=cat_name, user_id=None).first()
                if not category:
                    category = Category(name=cat_name, type=row.get('Type', 'expense').lower(), user_id=user_id)
                    db.session.add(category)
                    db.session.flush()

            txn = Transaction(
                date=datetime.strptime(row.get('Date'), '%Y-%m-%d'),
                type=row.get('Type', 'expense').lower(),
                category_id=category.id,
                amount=float(row.get('Amount')),
                currency=row.get('Currency', 'RUB'),
                description=row.get('Description', ''),
                user_id=user_id
            )
            db.session.add(txn)
            count += 1
        except Exception as e:
            errors += 1
            
    db.session.commit()
    return jsonify({"msg": f"Imported {count} transactions. {errors} failed."}), 200

def get_filtered_transactions(user_id):
    query = Transaction.query.filter_by(user_id=user_id)
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
        
    return query.order_by(Transaction.date.desc()).all()

@settings_bp.route('/export', methods=['GET'])
@jwt_required()
def export_data():
    user_id = int(get_jwt_identity())
    si = io.StringIO()
    si.write('\ufeff') # BOM
    cw = csv.writer(si)
    cw.writerow(['Date', 'Type', 'Category', 'Amount', 'Currency', 'Description'])
    
    transactions = get_filtered_transactions(user_id)
    
    for t in transactions:
        cat_name = t.category.name if t.category else 'Unknown'
        cw.writerow([t.date.strftime('%Y-%m-%d'), t.type, cat_name, t.amount, t.currency, t.description])
        
    output_bytes = si.getvalue().encode('utf-8-sig')
    output = make_response(output_bytes)
    
    # Filename with period
    start = request.args.get('start_date') or 'all'
    end = request.args.get('end_date') or 'all'
    filename = f"finance_export_{start}_to_{end}.csv"
    
    output.headers["Content-Disposition"] = f"attachment; filename={filename}"
    output.headers["Content-type"] = "text/csv; charset=utf-8-sig"
    return output

class CustomPDF(FPDF):
    def __init__(self, lang='en', *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.lang = lang
        self.texts = PDF_TRANSLATIONS.get(lang, PDF_TRANSLATIONS['en'])
        
        # Load font immediately
        font_path = os.path.join(current_app.root_path, 'static', 'DejaVuSans.ttf')
        if os.path.exists(font_path):
            # fpdf2 handles unicode fonts seamlessly
            self.add_font('DejaVu', '', font_path)
            self.font_available = True
        else:
            self.font_available = False

    def header(self):
        if self.font_available:
            self.set_font('DejaVu', '', 14)
        else:
            self.set_font('Arial', 'B', 14)
            
        self.cell(0, 10, self.texts['title'], 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        if self.font_available:
            self.set_font('DejaVu', '', 8)
        else:
            self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f"{self.texts['page']} " + str(self.page_no()) + '/{nb}', 0, 0, 'C')

@settings_bp.route('/export_pdf', methods=['GET'])
@jwt_required()
def export_pdf():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    base_currency = user.base_currency or 'RUB'
    
    # Get language from query param, default to Russian if not set
    lang = request.args.get('lang', 'ru')
    texts = PDF_TRANSLATIONS.get(lang, PDF_TRANSLATIONS['ru'])

    transactions = get_filtered_transactions(user_id)
    
    pdf = CustomPDF(lang=lang)
    pdf.alias_nb_pages()
    pdf.add_page()
    
    if pdf.font_available:
        pdf.set_font('DejaVu', '', 10)
    else:
        pdf.set_font('Arial', '', 10)
    
    # Metadata
    pdf.cell(0, 10, f"{texts['user']}: {user.name} ({user.email})", 0, 1)
    pdf.cell(0, 10, f"{texts['date']}: {datetime.now().strftime('%Y-%m-%d')}", 0, 1)
    
    start_date = request.args.get('start_date') or 'Beginning'
    end_date = request.args.get('end_date') or 'Now'
    pdf.cell(0, 10, f"{texts['period']}: {start_date} - {end_date}", 0, 1)
    pdf.ln(5)
    
    # Table Header
    pdf.set_fill_color(240, 240, 240)
    
    col_widths = [30, 40, 20, 70, 30]
    headers = [texts['col_date'], texts['col_cat'], texts['col_type'], texts['col_desc'], f"{texts['col_sum']} ({base_currency})"]
    
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 10, h, 1, 0, 'C', 1)
    pdf.ln()
    
    if pdf.font_available:
        pdf.set_font('DejaVu', '', 9)
    else:
        pdf.set_font('Arial', '', 9)
    
    total_income = 0
    total_expense = 0
    rate_cache = {}
    
    for t in transactions:
        amount = t.amount
        if t.currency != base_currency:
             k = f"{t.currency}_{base_currency}"
             if k not in rate_cache:
                 rate_cache[k] = get_conversion_rate(t.currency, base_currency)
             amount = t.amount * rate_cache[k]
        
        if t.type == 'income': total_income += amount
        else: total_expense += amount
        
        cat_name = t.category.name if t.category else 'Unknown'
        desc = t.description or ''

        # Translate type (income/expense)
        type_str = t.type
        if type_str in texts:
            type_str = texts[type_str]
        
        # In fpdf2 with TTF, we don't need manual latin-1 encoding
        if not pdf.font_available:
             cat_name = cat_name.encode('latin-1', 'replace').decode('latin-1')
             desc = desc.encode('latin-1', 'replace').decode('latin-1')
             type_str = type_str.encode('latin-1', 'replace').decode('latin-1')
        
        pdf.cell(30, 10, t.date.strftime('%Y-%m-%d'), 1)
        pdf.cell(40, 10, cat_name[:20], 1)
        pdf.cell(20, 10, type_str, 1)
        pdf.cell(70, 10, desc[:35], 1)
        pdf.cell(30, 10, f"{amount:.2f}", 1, 1, 'R')

    pdf.ln(10)
    if pdf.font_available:
        pdf.set_font('DejaVu', '', 11)
    else:
        pdf.set_font('Arial', 'B', 11)
    
    pdf.cell(100, 10, f"{texts['total_inc']}: {total_income:.2f} {base_currency}", 0, 1)
    pdf.cell(100, 10, f"{texts['total_exp']}: {total_expense:.2f} {base_currency}", 0, 1)
    pdf.cell(100, 10, f"{texts['net']}: {(total_income - total_expense):.2f} {base_currency}", 0, 1)
    
    # Filename with period
    filename_start = request.args.get('start_date') or 'all'
    filename_end = request.args.get('end_date') or 'all'
    filename = f'report_{filename_start}_to_{filename_end}.pdf'

    # fpdf2 returns bytes directly
    pdf_bytes = bytes(pdf.output(dest='S'))  # превращаем bytearray в bytes
    response = make_response(pdf_bytes)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename={filename}'
    return response