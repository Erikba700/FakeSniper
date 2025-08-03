import os
import asyncio
import argparse
import re
import boto3
from playwright.async_api import async_playwright
from botocore.exceptions import NoCredentialsError

S3_BUCKET = "fakesniper"  # change this
S3_FOLDER = "media"       # optional folder in S3 bucket

def sanitize_filename(url):
    return re.sub(r'[^a-zA-Z0-9]', '_', url)

async def capture_screenshot(url, output_path):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url)
        await page.screenshot(path=output_path)
        await browser.close()

def upload_to_s3(file_path, bucket, object_name):
    # Create the S3 client with explicit credentials
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name="us-east-1"  # set your region here
    )

    try:
        with open(file_path, "rb") as f:
            s3.put_object(Bucket=bucket, Key=object_name, Body=f)

        url = f"https://{bucket}.s3.amazonaws.com/{object_name}"
        print(url)
        return url
    except NoCredentialsError:
        print("AWS credentials not found.")
        return None
    except Exception as e:
        print(f"Failed to upload to S3: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Capture a screenshot of a webpage.")
    parser.add_argument("url", help="The URL of the webpage to capture.")
    parser.add_argument("--output", help="The local output path for the screenshot (optional).")
    args = parser.parse_args()

    if args.output:
        output_path = args.output
    else:
        filename = sanitize_filename(args.url) + ".png"
        output_path = os.path.join("media", filename)

    asyncio.run(capture_screenshot(args.url, output_path))

    s3_key = f"{S3_FOLDER}/{os.path.basename(output_path)}"
    public_url = upload_to_s3(output_path, S3_BUCKET, s3_key)
