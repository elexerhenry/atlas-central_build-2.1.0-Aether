# app.py
from flask import Flask, render_template, request, Response, redirect, abort
import requests
import json

app = Flask(__name__)

# --- CONFIGURATION ---
# List of commonly proxied sites for better handling (optional)
PROXY_TARGETS = [
    "discord.com",
    "youtube.com",
    "reddit.com"
]
# --- END CONFIGURATION ---


# ----------------------------------------------------------------------
# 1. FRONT-END SERVING
# Serves the main index.html file when the user visits the root of the server.
# This ensures that your client-side navigation still works.
# ----------------------------------------------------------------------
@app.route('/')
def index():
    """Serves the main application page."""
    # Assuming index.html is in the same directory (or a 'templates' folder if you structure it that way)
    return render_template('index.html')


# ----------------------------------------------------------------------
# 2. PROXY SERVICE HANDLER
# This route handles requests coming from your JavaScript's handleProxySearch() function.
# The JavaScript sends a normalized URL/domain via an AJAX call (or fetch).
# NOTE: The client-side JS currently uses an alert(), so you'll need to update it
# to use a fetch() call to interact with this route.
# ----------------------------------------------------------------------
@app.route('/proxy', methods=['POST'])
def handle_proxy_request():
    """
    Accepts a POST request with the 'target_url' and fetches the content.
    """
    # 1. Get the target URL from the JSON request body
    data = request.get_json()
    target_url = data.get('target_url')
    
    if not target_url:
        return json.dumps({"error": "Missing target_url"}), 400, {'Content-Type': 'application/json'}

    # 2. Normalize the URL for requests
    # Ensure it has a protocol (requests needs this)
    if not target_url.startswith('http'):
        target_url = 'https://' + target_url.replace('https://', '').replace('http://', '')
        
    print(f"PROXY REQUEST: Attempting to fetch {target_url}")

    try:
        # 3. Fetch the external content
        # We set a reasonable timeout and use stream=True for large content
        response = requests.get(
            target_url, 
            stream=True, 
            timeout=15, 
            # We mimic the headers of a standard browser to increase success rate
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        response.raise_for_status() # Raise exception for bad status codes (4xx or 5xx)

        # 4. Create a Flask Response to send back the proxied content
        # We strip out risky headers like 'Content-Encoding' or 'Transfer-Encoding'
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        
        # Prepare headers for the final response
        headers = [
            (name, value) for name, value in response.raw.headers.items()
            if name.lower() not in excluded_headers
        ]

        # Return the proxied content, status code, and headers
        # NOTE: This returns the RAW HTML/CSS/JS. To make links/resources within the proxied page work, 
        # you would need complex HTML rewriting here (which is beyond this simple framework).
        return Response(response.iter_content(chunk_size=1024), response.status_code, headers)

    except requests.exceptions.RequestException as e:
        print(f"PROXY ERROR: {e}")
        error_message = f"Proxy failed to fetch {target_url}: {e}"
        # Return a simple error response
        return json.dumps({"error": error_message}), 502, {'Content-Type': 'application/json'}
    except Exception as e:
        print(f"AN UNEXPECTED ERROR OCCURRED: {e}")
        return json.dumps({"error": f"An unexpected error occurred: {e}"}), 500, {'Content-Type': 'application/json'}


# ----------------------------------------------------------------------
# 3. RUN THE FLASK APP
# Use this block to run the app in development mode
# ----------------------------------------------------------------------
if __name__ == '__main__':
    # Use template_folder='.' if your index.html is in the same directory as app.py
    app.run(debug=True, port=5000)