from flask import Flask, jsonify
from flask_cors import CORS
import data_pipeline
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/refresh_data', methods=['POST'])
def refresh_data():
    try:
        logger.info("Received refresh request...")
        
        fundamentals, history = data_pipeline.run_pipeline()
        
        if fundamentals:
            return jsonify({
                "status": "success", 
                "message": "Data refreshed successfully", 
                "data": {
                    "fundamentals": fundamentals,
                    "history": history
                }
            }), 200
        else:
            return jsonify({"status": "error", "message": "Pipeline returned empty data"}), 500
            
    except Exception as e:
        logger.error(f"Server Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("🌍 API Server running on http://localhost:5000")
    app.run(debug=True, port=5000)