import mysql.connector
from mysql.connector import Error
import logging
import schedule
import time
import subprocess
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def check_and_update_db():
    try:
        # Establish a connection to the MariaDB database
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD')
        )

        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            # Query to select rows with status_code 200
            select_query = "SELECT ID, target FROM fs_targets WHERE image = '' or image is null"
            cursor.execute(select_query)
            rows = cursor.fetchall()

            for row in rows:
                # Retrieve target URL
                target_url = row['target']
                logging.info(f"Processing URL for screenshot: {target_url}")

                # Call playwright_screenshot_service.py with the URL
                result = subprocess.run(['python', 'service/playwright_screenshot_service.py', target_url], capture_output=True, text=True)
                image_url = result.stdout.strip()

                # Debug: Print the raw output from playwright_screenshot_service.py
                logging.info(f"Raw output from playwright_screenshot_service.py: {image_url}")

                # Extract the image URL from the output

                # Update the database with the image URL
                update_query = "UPDATE fs_targets SET image = %s WHERE id = %s"
                cursor.execute(update_query, (image_url, row['ID']))

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
