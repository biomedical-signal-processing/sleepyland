# @app.route('/process_dynamics', methods=['POST'])
# def process_dynamics():
#     data = request.get_json()
#
#     age = data.get('age')
#     gender = data.get('gender')
#     study = data.get('study')
#
#     try:
#         response = send_to_dynamic_service(age, gender, study)
#
#         return jsonify({
#             'message': 'Processing complete'
#         }), 200
#
#     except Exception as e:
#         logger.error(f"An error occurred: {str(e)}")
#         return jsonify({'error': f'An error occurred app.py: {e}'}), 500
#

from app import app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8887)
