from flask import Blueprint, request, jsonify
from models import User
import json
import os

agent_bp = Blueprint('agent', __name__)

# Load market data once
MARKET_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'market_data.json')

with open(MARKET_DATA_PATH, 'r') as f:
    market_data = json.load(f)

# Utility to get market returns
def get_market_returns():
    stock_return = sum(stock['growth_pct_yoy'] for stock in market_data['stocks']) / len(market_data['stocks'])
    mf_return = sum(mf['return_pct_3y_cagr'] for mf in market_data['mutual_funds']) / len(market_data['mutual_funds'])
    fd_return = sum(fd['rate_pct'] for fd in market_data['fixed_deposits']) / len(market_data['fixed_deposits'])
    return stock_return, mf_return, fd_return


@agent_bp.route('/agent', methods=['POST'])
def agent_logic():
    data = request.json
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user or not user.profile:
        return jsonify({"error": "User profile not found"}), 404

    profile = user.profile
    risk = data.get('risk_override') or profile.risk_appetite
    income = profile.monthly_income
    surplus = income - profile.monthly_expenses
    investment_horizon = profile.investment_horizon

    # Define agent's default allocation strategy
    if risk == 'High':
        agent_alloc = {'Stocks': 70, 'Mutual Funds': 20, 'Fixed Deposits': 10}
    elif risk == 'Medium':
        agent_alloc = {'Stocks': 40, 'Mutual Funds': 40, 'Fixed Deposits': 20}
    else:
        agent_alloc = {'Stocks': 10, 'Mutual Funds': 40, 'Fixed Deposits': 50}

    # Get market returns
    stock_return, mf_return, fd_return = get_market_returns()

    # Agent expected return
    agent_expected_return = (
        agent_alloc['Stocks'] * stock_return +
        agent_alloc['Mutual Funds'] * mf_return +
        agent_alloc['Fixed Deposits'] * fd_return
    ) / 100

    # Standard return: agent suggestion
    explanation = f"""
    Based on your {risk.lower()} risk appetite and a {investment_horizon}-year investment horizon,
    we suggest allocating {agent_alloc['Stocks']}% to Stocks, {agent_alloc['Mutual Funds']}% to Mutual Funds,
    and {agent_alloc['Fixed Deposits']}% to Fixed Deposits.

    You’re planning to invest ₹{surplus:.2f} monthly, and with current market trends,
    you can expect an average return of around {agent_expected_return:.2f}% per year.
    """

    return jsonify({
        "allocation": [
            {"category": "Stocks", "value": agent_alloc['Stocks']},
            {"category": "Mutual Funds", "value": agent_alloc['Mutual Funds']},
            {"category": "Fixed Deposits", "value": agent_alloc['Fixed Deposits']}
        ],
        "suggestion": explanation.strip(),
        "stock_return": stock_return,
        "mf_return": mf_return,
        "fd_return": fd_return,
        "risk_appetite": risk
    })


@agent_bp.route('/agent/compare', methods=['POST'])
def compare_custom_allocation():
    data = request.json
    email = data.get('email')
    custom = data.get('custom_allocation')
    risk = data.get('risk')

    if not email or not custom or not risk:
        return jsonify({"error": "Missing data"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.profile:
        return jsonify({"error": "User not found"}), 404

    profile = user.profile
    investment_horizon = profile.investment_horizon

    # Market data
    stock_return = sum(s['growth_pct_yoy'] for s in market_data['stocks']) / len(market_data['stocks'])
    mf_return = sum(m['return_pct_3y_cagr'] for m in market_data['mutual_funds']) / len(market_data['mutual_funds'])
    fd_return = sum(f['rate_pct'] for f in market_data['fixed_deposits']) / len(market_data['fixed_deposits'])

    # Agent allocation
    if risk == 'High':
        agent_alloc = {'Stocks': 70, 'Mutual Funds': 20, 'Fixed Deposits': 10}
    elif risk == 'Medium':
        agent_alloc = {'Stocks': 40, 'Mutual Funds': 40, 'Fixed Deposits': 20}
    else:
        agent_alloc = {'Stocks': 10, 'Mutual Funds': 40, 'Fixed Deposits': 50}

    # Compute returns
    def compute_return(alloc):
        return (
            alloc['Stocks'] * stock_return +
            alloc['Mutual Funds'] * mf_return +
            alloc['Fixed Deposits'] * fd_return
        ) / 100

    user_alloc = {
        'Stocks': custom.get('Stocks', 0),
        'Mutual Funds': custom.get('MutualFunds', 0),
        'Fixed Deposits': custom.get('FixedDeposits', 0)
    }

    user_expected = compute_return(user_alloc)
    agent_expected = compute_return(agent_alloc)

    recommendation = "Your allocation is already optimal."
    if user_expected < agent_expected:
        recommendation = (
            f"Consider shifting to {agent_alloc['Stocks']}% Stocks, "
            f"{agent_alloc['Mutual Funds']}% Mutual Funds, and "
            f"{agent_alloc['Fixed Deposits']}% Fixed Deposits to maximize returns."
        )

    return jsonify({
        "user_expected_return": user_expected,
        "agent_expected_return": agent_expected,
        "recommendation": recommendation
    })
