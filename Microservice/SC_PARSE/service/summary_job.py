import mysql.connector
from mysql.connector import Error
import logging
import schedule
import time
import subprocess
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def check_and_update_db():
    try:
        # Establish a connection to the MariaDB database
        connection = mysql.connector.connect(
            host='84.200.91.253',
            database='fakesniper',
            user='root',
            password='hurdpas3sw0rd'
        )

        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            # Query to select rows with status_code 200
            select_query = "SELECT ID, target FROM fs_se_lists WHERE status_code = 200"
            cursor.execute(select_query)
            rows = cursor.fetchall()

            for row in rows:
                # Retrieve target URL
                target_url = row['target']
                logging.info(f"Processing URL for summary: {target_url}")

                # Call request_parser.py with the URL
                result = subprocess.run(['python', 'service/request_parser.py', target_url], capture_output=True, text=True)
                output = result.stdout.strip()

                # Debug: Print the raw output from request_parser.py
                logging.info(f"Raw output from request_parser.py: {output}")

                # Parse the JSON response
                try:
                    response = json.loads(output)
                    if response['status_code'] == 300:
                        # Update the database with the summary and news_date
                        update_query = "UPDATE fs_se_lists SET summary = %s, news_date = %s, title = %s, status_code = %s WHERE id = %s"
                        cursor.execute(update_query, (json.dumps(response["summary"]), response.get('news_date', ''), response["title"], response["status_code"], row['ID']))
                    else:
                        update_query = "UPDATE fs_se_lists SET status_code = %s WHERE id = %s"
                        cursor.execute(update_query, ("404", row['ID']))
                        logging.error(f"Error processing URL {target_url}: {response.get('error', 'Unknown error')}")
                except json.JSONDecodeError:
                    update_query = "UPDATE fs_se_lists SET status_code = %s WHERE id = %s"
                    cursor.execute(update_query, ("404", row['ID']))
                    logging.error(f"Invalid JSON received from request_parser.py: {output}")

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
