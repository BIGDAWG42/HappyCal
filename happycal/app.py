from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/history')
def get_history():
    history_file = 'history.json'
    if os.path.exists(history_file):
        with open(history_file, 'r') as f:
            return jsonify(json.load(f))
    return jsonify([])

@app.route('/api/scan', methods=['POST'])
def scan_food():
    # In a real implementation, this would call an AI model
    # For now, returning mock data
    return jsonify({
        "food": "Spaghetti Carbonara",
        "calories": 450,
        "protein": 15,
        "carbs": 50,
        "fat": 20,
        "confidence": 95
    })

if __name__ == '__main__':
    app.run(debug=True)
