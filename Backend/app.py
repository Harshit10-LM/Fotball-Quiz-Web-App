"""
UEFA Football Quiz Arena — Flask Backend API
=============================================
Persistent database powered by Supabase (PostgreSQL).
Provides GET, POST, PUT, DELETE endpoints for quiz questions.
Data validation on all write operations.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client

# ──────────────────────────────────────────────
# Initialisation
# ──────────────────────────────────────────────

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        '❌  SUPABASE_URL and SUPABASE_KEY must be set in backend/.env\n'
        '   Get them from: https://app.supabase.com → Project → Settings → API'
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app)  # Allow frontend to call API from any origin

# Allowed categories for validation
ALLOWED_CATEGORIES = [
    'champions-league', 'world-cup', 'euro',
    'la-liga', 'premier-league', 'legends', 'records'
]


# ──────────────────────────────────────────────
# Validation Helper
# ──────────────────────────────────────────────

def validate_question_data(data):
    """
    Validates incoming question data.
    Returns (is_valid, error_message) tuple.
    """
    errors = []

    # Check required fields exist
    if not data:
        return False, 'Request body must be valid JSON.'

    # Validate question text
    question = data.get('question', '')
    if not question or not isinstance(question, str):
        errors.append('Field "question" is required and must be a non-empty string.')
    elif len(question.strip()) < 10:
        errors.append('Field "question" must be at least 10 characters long.')

    # Validate options
    options = data.get('options', [])
    if not isinstance(options, list) or len(options) != 4:
        errors.append('Field "options" must be an array of exactly 4 strings.')
    else:
        for i, opt in enumerate(options):
            if not opt or not isinstance(opt, str) or len(opt.strip()) == 0:
                errors.append(f'Option {i + 1} must be a non-empty string.')

    # Validate correct answer index
    correct = data.get('correct')
    if correct is None:
        errors.append('Field "correct" is required (integer 0-3).')
    elif not isinstance(correct, int) or correct not in [0, 1, 2, 3]:
        errors.append('Field "correct" must be an integer between 0 and 3.')

    # Validate category
    category = data.get('category', '')
    if not category or category not in ALLOWED_CATEGORIES:
        errors.append(f'Field "category" must be one of: {", ".join(ALLOWED_CATEGORIES)}')

    if errors:
        return False, errors

    return True, None


# ──────────────────────────────────────────────
# API Routes
# ──────────────────────────────────────────────

@app.route('/')
def home():
    """Health check / welcome endpoint."""
    # Get a quick count from Supabase
    count_resp = supabase.table('questions').select('id', count='exact').execute()
    total = count_resp.count if count_resp.count is not None else len(count_resp.data)

    # Get leaderboard count too
    lb_resp = supabase.table('leaderboard').select('id', count='exact').execute()
    lb_total = lb_resp.count if lb_resp.count is not None else len(lb_resp.data)

    return jsonify({
        'message': 'UEFA Football Quiz Arena — Backend API',
        'version': '2.0 (Supabase)',
        'endpoints': {
            'GET /api/questions': 'Get all questions (optional ?category= filter)',
            'GET /api/questions/<id>': 'Get a single question by ID',
            'POST /api/questions': 'Add a new question (JSON body)',
            'PUT /api/questions/<id>': 'Update a question by ID',
            'DELETE /api/questions/<id>': 'Delete a question by ID',
            'GET /api/questions/search?q=': 'Search questions by keyword',
            'GET /api/leaderboard': 'Get all leaderboard entries',
            'POST /api/leaderboard': 'Save a new score',
            'DELETE /api/leaderboard/<id>': 'Delete a leaderboard entry'
        },
        'total_questions': total,
        'total_leaderboard_entries': lb_total
    })


# ── GET all questions ──
@app.route('/api/questions', methods=['GET'])
def get_questions():
    """
    Returns all questions from Supabase.
    Supports optional query parameter: ?category=champions-league
    """
    category = request.args.get('category')

    if category:
        # Filter by category
        if category not in ALLOWED_CATEGORIES:
            return jsonify({
                'error': f'Invalid category. Allowed: {", ".join(ALLOWED_CATEGORIES)}'
            }), 400
        response = supabase.table('questions').select('*').eq('category', category).execute()
        return jsonify({
            'success': True,
            'count': len(response.data),
            'category': category,
            'questions': response.data
        })

    # No filter — return all
    response = supabase.table('questions').select('*').execute()
    return jsonify({
        'success': True,
        'count': len(response.data),
        'questions': response.data
    })


# ── SEARCH questions (must be before <int:question_id> route) ──
@app.route('/api/questions/search', methods=['GET'])
def search_questions():
    """Search questions by keyword in question text."""
    keyword = request.args.get('q', '').strip()

    if not keyword:
        return jsonify({'error': 'Query parameter "q" is required.'}), 400

    # Supabase ilike for case-insensitive search
    response = supabase.table('questions').select('*').ilike('question', f'%{keyword}%').execute()

    return jsonify({
        'success': True,
        'count': len(response.data),
        'keyword': keyword,
        'questions': response.data
    })


# ── GET single question by ID ──
@app.route('/api/questions/<int:question_id>', methods=['GET'])
def get_question(question_id):
    """Returns a single question by its ID."""
    response = supabase.table('questions').select('*').eq('id', question_id).execute()

    if not response.data:
        return jsonify({'error': f'Question with ID {question_id} not found.'}), 404

    return jsonify({'success': True, 'question': response.data[0]})


# ── POST create a new question ──
@app.route('/api/questions', methods=['POST'])
def create_question():
    """
    Creates a new question. Expects JSON body:
    {
        "question": "Who won...?",
        "options": ["A", "B", "C", "D"],
        "correct": 1,
        "category": "champions-league"
    }
    """
    data = request.get_json()

    # Validate the data
    is_valid, errors = validate_question_data(data)
    if not is_valid:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400

    # Build the row to insert
    new_row = {
        'question': data['question'].strip(),
        'options': [opt.strip() for opt in data['options']],
        'correct': data['correct'],
        'category': data['category']
    }

    response = supabase.table('questions').insert(new_row).execute()

    return jsonify({
        'success': True,
        'message': 'Question created successfully.',
        'question': response.data[0]
    }), 201


# ── PUT update a question ──
@app.route('/api/questions/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    """Updates an existing question by ID."""
    # Check existence first
    existing = supabase.table('questions').select('*').eq('id', question_id).execute()
    if not existing.data:
        return jsonify({'error': f'Question with ID {question_id} not found.'}), 404

    data = request.get_json()

    # Validate the data
    is_valid, errors = validate_question_data(data)
    if not is_valid:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400

    # Update the row
    updated_row = {
        'question': data['question'].strip(),
        'options': [opt.strip() for opt in data['options']],
        'correct': data['correct'],
        'category': data['category']
    }

    response = supabase.table('questions').update(updated_row).eq('id', question_id).execute()

    return jsonify({
        'success': True,
        'message': f'Question {question_id} updated successfully.',
        'question': response.data[0]
    })


# ── DELETE a question ──
@app.route('/api/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """Deletes a question by ID."""
    # Check existence first
    existing = supabase.table('questions').select('id').eq('id', question_id).execute()
    if not existing.data:
        return jsonify({'error': f'Question with ID {question_id} not found.'}), 404

    supabase.table('questions').delete().eq('id', question_id).execute()

    return jsonify({
        'success': True,
        'message': f'Question {question_id} deleted successfully.'
    })


# ──────────────────────────────────────────────
# Leaderboard Routes
# ──────────────────────────────────────────────

# ── GET all leaderboard entries ──
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Returns all leaderboard entries sorted by score descending."""
    response = supabase.table('leaderboard') \
        .select('*') \
        .order('score', desc=True) \
        .execute()

    return jsonify({
        'success': True,
        'count': len(response.data),
        'leaderboard': response.data
    })


# ── POST save a new score ──
@app.route('/api/leaderboard', methods=['POST'])
def create_leaderboard_entry():
    """
    Saves a new leaderboard entry. Expects JSON body:
    {
        "name": "Player Name",
        "score": 800,
        "total": 10,
        "category": "champions-league",
        "date": "03/05/2026"
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body must be valid JSON.'}), 400

    errors = []
    name = data.get('name', '')
    if not name or not isinstance(name, str) or len(name.strip()) < 1:
        errors.append('Field "name" is required.')

    score = data.get('score')
    if score is None or not isinstance(score, (int, float)):
        errors.append('Field "score" is required and must be a number.')

    total = data.get('total')
    if total is None or not isinstance(total, int):
        errors.append('Field "total" is required and must be an integer.')

    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 400

    new_entry = {
        'name': name.strip(),
        'score': int(score),
        'total': total,
        'category': data.get('category', 'all'),
        'date': data.get('date', '')
    }

    response = supabase.table('leaderboard').insert(new_entry).execute()

    return jsonify({
        'success': True,
        'message': 'Score saved successfully.',
        'entry': response.data[0]
    }), 201


# ── DELETE a leaderboard entry ──
@app.route('/api/leaderboard/<int:entry_id>', methods=['DELETE'])
def delete_leaderboard_entry(entry_id):
    """Deletes a leaderboard entry by ID (admin use)."""
    existing = supabase.table('leaderboard').select('id').eq('id', entry_id).execute()
    if not existing.data:
        return jsonify({'error': f'Leaderboard entry {entry_id} not found.'}), 404

    supabase.table('leaderboard').delete().eq('id', entry_id).execute()

    return jsonify({
        'success': True,
        'message': f'Leaderboard entry {entry_id} deleted successfully.'
    })


# ──────────────────────────────────────────────
# Run the server
# ──────────────────────────────────────────────

if __name__ == '__main__':
    # Quick connectivity check
    try:
        check = supabase.table('questions').select('id', count='exact').execute()
        total = check.count if check.count is not None else len(check.data)
        lb_check = supabase.table('leaderboard').select('id', count='exact').execute()
        lb_total = lb_check.count if lb_check.count is not None else len(lb_check.data)
    except Exception as e:
        print(f'⚠️  Could not reach Supabase: {e}')
        total = '?'
        lb_total = '?'

    print('=' * 50)
    print('  UEFA Football Quiz Arena — Backend API')
    print(f'  Connected to Supabase ✅')
    print(f'  Questions in database: {total}')
    print(f'  Leaderboard entries:   {lb_total}')
    print(f'  Server running on port {port}')
    print('=' * 50)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)