from flask import Flask
from flask_cors import CORS
from models import db, User, UserProfile

from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.agent import agent_bp
from routes.chat import chat_bp

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:yallasql@localhost:3306/smart_financial_advisor'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(agent_bp)
app.register_blueprint(chat_bp)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
