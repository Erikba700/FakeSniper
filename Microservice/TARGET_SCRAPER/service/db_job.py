import mysql.connector
from mysql.connector import Error
import logging
import schedule
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def check_and_update_db():
    try:
        # Establish a connection to the MariaDB database
        import os
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD')
        )

        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            # Query to select rows with status_code 0
            select_query = "SELECT ID, target FROM fs_targets WHERE status_code = 0"
            cursor.execute(select_query)
            rows = cursor.fetchall()

            for row in rows:
                # Retrieve target URL
                target_url = row['target']
                logging.info(f"Processing URL: {target_url}")

                # Call parser.py with the URL
                import subprocess
                import time
                time.sleep(2)  # Add a delay to allow the process more time to complete
                result = subprocess.run(['python', 'service/request_parser.py', target_url], capture_output=True, text=True)
                output = result.stdout.strip()

                # Debug: Print the raw output from request_parser.py
                logging.info(f"Raw output from request_parser.py: {output}")

                # Parse the JSON response
                import json
                response = {"status_code": 500, "error": "Invalid JSON format"}
                try:
                    # Clean the output to ensure valid JSON
                    cleaned_output = output.replace("```json", "").replace("```", "").strip()
                    if cleaned_output:
                        response = json.loads(cleaned_output)
                    else:
                        logging.error("No output received from request_parser.py")
                        response = {"status_code": 500, "error": "No output received"}
                except json.JSONDecodeError:
                    logging.error(f"Invalid JSON received from request_parser.py: {output}")
                    logging.info(f"Attempting to clean and parse JSON: {cleaned_output}")
                    logging.debug(f"Raw output before cleaning: {output}")
                    logging.debug(f"Cleaned output: {cleaned_output}")
                    logging.info("Attempting to clean and parse JSON...")
                    cleaned_output = output.replace("```json", "").replace("```", "").strip()
                    logging.info(f"Cleaned output: {cleaned_output}")
                    response = json.loads(cleaned_output)
                    logging.error("Invalid JSON received from request_parser.py")
                    # response = {"status_code": 500, "error": "Invalid JSON format"}

                # Update the database with the new status_code and keywords
                if response['status_code'] == 200:
                    update_query = "UPDATE fs_targets SET status_code = %s, keywords = %s, title = %s, summary = %s, create_date = UNIX_TIMESTAMP(), task_done_date = UNIX_TIMESTAMP() WHERE id = %s"
                    article_title = response.get("article_title", "N/A")
                 
                    summary = response.get("summary", "N/A")
                    cursor.execute(update_query, (response['status_code'], json.dumps(response['keywords']), response["title"], summary, row['ID']))
                else:
                    update_query = "UPDATE fs_targets SET status_code = %s, task_done_date = UNIX_TIMESTAMP() WHERE id = %s"
                    cursor.execute(update_query, (response['status_code'], row['ID']))

                connection.commit()

    except Error as e:
        logging.error(f"Error: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def job():
    check_and_update_db()

if __name__ == "__main__":
    schedule.every(1).seconds.do(job)
    while True:
        schedule.run_pending()
        time.sleep(1)
