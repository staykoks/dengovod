from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db, migrate, jwt
from routes.auth import auth_bp
from routes.transactions import trans_bp
from routes.analytics import analytics_bp
from routes.categories import cat_bp
from routes.budgets import budget_bp
from routes.currencies import currency_bp
from routes.settings import settings_bp
import os
import traceback

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure upload folder exists
    upload_folder = os.path.join(app.root_path, 'static', 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(trans_bp, url_prefix='/api/transactions')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(cat_bp, url_prefix='/api/categories')
    app.register_blueprint(budget_bp, url_prefix='/api/budgets')
    app.register_blueprint(currency_bp, url_prefix='/api/currencies')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')

    # Global Error Handler for debugging 500s
    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Server Error: {e}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "msg": "Internal Server Error",
            "error": str(e)
        }), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)