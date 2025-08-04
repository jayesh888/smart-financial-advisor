from flask import Blueprint, request, jsonify
from models import db, User
import json, os, re, logging
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.agents import initialize_agent, Tool
from langchain.agents.agent_types import AgentType
from langchain.memory import ConversationBufferMemory

load_dotenv()
chat_bp = Blueprint('chat', __name__)

# Load model and market data
llm = ChatOpenAI(temperature=0.4, model="gpt-4", max_tokens=120)
market_path = os.path.join(os.path.dirname(__file__), '../market_data.json')
with open(market_path, 'r') as f:
    market_data = json.load(f)

# Allocation logic
def get_allocation(risk):
    if risk == 'High':
        return {'Stocks': 70, 'Mutual Funds': 20, 'Fixed Deposits': 10}
    elif risk == 'Medium':
        return {'Stocks': 40, 'Mutual Funds': 40, 'Fixed Deposits': 20}
    else:
        return {'Stocks': 10, 'Mutual Funds': 40, 'Fixed Deposits': 50}

# Tool 1: Fetch user profile
def fetch_user_info(email):
    user = User.query.filter_by(email=email).first()
    if not user or not user.profile:
        return "User profile not found."
    p = user.profile
    return (
        f"Name: {p.name}\n"
        f"Monthly Income: ₹{p.monthly_income}\n"
        f"Monthly Expenses: ₹{p.monthly_expenses}\n"
        f"Risk Appetite: {p.risk_appetite}\n"
        f"Financial Goal: {p.financial_goal}\n"
        f"Investment Horizon: {p.investment_horizon} years\n"
        f"Surplus: ₹{p.monthly_income - p.monthly_expenses:.2f}"
    )

# Tool 2: Calculate expected return
def expected_return(risk):
    alloc = get_allocation(risk)
    stock_ret = sum(s['growth_pct_yoy'] for s in market_data['stocks']) / len(market_data['stocks'])
    mf_ret = sum(m['return_pct_3y_cagr'] for m in market_data['mutual_funds']) / len(market_data['mutual_funds'])
    fd_ret = sum(fd['rate_pct'] for fd in market_data['fixed_deposits']) / len(market_data['fixed_deposits'])

    total = (
        alloc['Stocks'] * stock_ret +
        alloc['Mutual Funds'] * mf_ret +
        alloc['Fixed Deposits'] * fd_ret
    ) / 100
    return f"For {risk} risk appetite, the expected return is ~{total:.2f}%."

# LangChain tools
tools = [
    Tool(name="UserProfile", func=fetch_user_info, description="Fetch the user's financial profile from DB using email."),
    Tool(name="ExpectedReturn", func=expected_return, description="Calculate expected return based on risk level."),
]

# Chat endpoint
@chat_bp.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        email = data.get('email')
        message = data.get('message', '').strip()

        if not email or not message:
            return jsonify({"error": "Email and message required"}), 400

        # Guardrails: blocked or unsafe input
        unsafe = ["password", "secret", "credentials"]
        unethical = ["scam", "gambling", "black money", "loan shark"]
        if any(word in message.lower() for word in unsafe):
            return jsonify({"response": "For your safety, I cannot access or reveal passwords or credentials."})
        if any(word in message.lower() for word in unethical):
            return jsonify({"response": "Warning: Please avoid asking about illegal or unethical financial practices."})

        # Check user existence
        user = User.query.filter_by(email=email).first()
        if not user or not user.profile:
            return jsonify({"response": "User profile not found. Please complete your profile first."})

        # Memory (optional, can be removed if stateless)
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

        # Initialize agent
        agent = initialize_agent(
            tools=tools,
            llm=llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=False,
            memory=memory,
            handle_parsing_errors=True,
            max_iterations=5
        )

        # Prompt context
        prompt = f"""
            You are a smart, ethical, and helpful financial advisor bot named FinWise.

            Your job is to assist users with personalized investment advice based on:
            - Their financial profile (monthly income, expenses, risk appetite, goals, and investment horizon).
            - Market data (growth rates of stocks, mutual funds, and fixed deposits).
            - Any scenario-based queries like “What if I invest more?”, “What if I retire earlier?”, etc.

            TOOLS:
            - Use `UserProfile` to fetch user profile by email.
            - Use `ExpectedReturn` to compute expected return for any given risk appetite (Low, Medium, High).

            GUIDELINES:
            1. Always fetch the user’s financial profile first.
            2. Use profile risk level and investment horizon to recommend asset allocation using the get_allocation() logic:
            - High: Stocks 70%, Mutual Funds 20%, FD 10%
            - Medium: Stocks 40%, Mutual Funds 40%, FD 20%
            - Low: Stocks 10%, Mutual Funds 40%, FD 50%
            3. Use mock market data to dynamically compute returns. For example:
            - If a user has ₹20,000 surplus and chooses Medium risk, calculate allocation:
                - ₹8,000 in Stocks, ₹8,000 in Mutual Funds, ₹4,000 in FD
                - Multiply each by the average return rates from the dataset to estimate total expected return.
            4. If the user asks about investing more monthly, retirement planning, or switching risk level:
            - Suggest how it will affect the investment growth.
            - Mention that investing more can help them reach their financial goal faster.
            5. If the user asks about unethical things like gambling, black money, or scams:
            - Warn politely and advise legal alternatives.
            6. Never share sensitive data like passwords.
            - You can share their email or username if requested.
            7. Do not answer technical backend questions like "what database are you using", "which framework", etc.
            - Respond politely saying your focus is financial guidance.
            8. If a user just says “hi” or “hello”, greet and briefly prompt them to ask something investment-related.
            9. Avoid hardcoded replies. Always reason based on profile + market + user query.

            FORMAT:
            - Keep answers polite, informative, and under 3-5 short, clear sentences.
            - Use percentages and INR symbols (₹) when relevant.
            - Avoid sounding robotic. Be human-like, but professional.

            User email: {email}
            User message: "{message}"
            """
        response = agent.run(prompt)
        return jsonify({"response": response})

    except Exception as e:
        logging.exception("Agent failed")
        return jsonify({"response": "Something went wrong while processing your request."}), 500