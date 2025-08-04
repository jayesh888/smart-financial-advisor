from flask import Blueprint, request, jsonify
from models import db, User, UserProfile

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['POST'])
def save_profile():
    data = request.json

    email = data.get('email')
    name = data.get('name')
    monthly_income = data.get('monthly_income')
    monthly_expenses = data.get('monthly_expenses')
    risk_appetite = data.get('risk_appetite')
    financial_goal = data.get('financial_goal')
    investment_horizon = data.get('investment_horizon')

    if not email:
        return jsonify({"error": "Missing user email"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if profile already exists
    if user.profile:
        return jsonify({"error": "Profile already exists"}), 400

    new_profile = UserProfile(
        name=name,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        risk_appetite=risk_appetite,
        financial_goal=financial_goal,
        investment_horizon=investment_horizon,
        user_id=user.id
    )
    db.session.add(new_profile)
    db.session.commit()

    return jsonify({"message": "Profile saved successfully"}), 201
