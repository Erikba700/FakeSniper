import requests
from bs4 import BeautifulSoup
import openai
import json
import os

def fetch_html(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.text

def parse_html(html):
    return html

def get_main_text_from_gpt(text):
    openai_api_key = os.getenv('OPENAI_API_KEY')
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Extract the title of the news without changing it, provide a concise summary of the news content with original content language for comparison with other articles, and give the key words of the news. Respond with status code 200 if everything is okay and 404 if the site is not reachable. Format the response as valid JSON: {{\"status_code\": 200, \"title\": \"article_title\", \"summary\": \"concise_summary\", \"keywords\": [\"keyword1\", \"keyword2\"]}}. If the site is not reachable, return: {{\"status_code\": 404, \"error\": \"web site is unreachable\"}}. Ensure the summary is included in the response. Do not add any comments, just return plain valid JSON: {text}. Make sure to include the summary field in the response."}
        ],
        max_tokens=500
    )
    content = response.choices[0].message['content'].replace("```json", "").replace("```", "").strip()
    try:
        json.loads(content)
    except json.JSONDecodeError:
        print("Invalid JSON format received from GPT.")
        return '{"status_code": 500, "error": "Invalid JSON format"}'

    if '"keywords": []' in content:
        return '{"status_code": 402, "message": "Please try again later."}'
    return content

def main(url):
    html = fetch_html(url)
    parsed_text = parse_html(html)
    main_text = get_main_text_from_gpt(parsed_text)
    return main_text

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python url_parser.py <url>")
    else:
        url = sys.argv[1]
        print(main(url))
