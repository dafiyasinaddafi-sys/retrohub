import urllib.request
import json

tables = [
    "profiles",
    "categories",
    "products",
    "bids",
    "orders",
    "chat_messages",
    "buyer_addresses"
]

apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZmFra3F2dG90aW5yc2NxanlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzUxMTEsImV4cCI6MjA5Njc1MTExMX0.MUvZMo7J0lbeYZuUBkHtI3B5bGxAgknnqHIAlugFlh0"

for table in tables:
    url = f"https://wpfakkqvtotinrscqjyi.supabase.co/rest/v1/{table}?select=*"
    req = urllib.request.Request(url)
    req.add_header("apikey", apikey)
    req.add_header("Authorization", f"Bearer {apikey}")
    
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            print(f"Table '{table}': Accessible (Status {status_code})")
    except urllib.error.HTTPError as e:
        print(f"Table '{table}': Error - {e.code} ({e.reason})")
    except Exception as e:
        print(f"Table '{table}': Error - {e}")
