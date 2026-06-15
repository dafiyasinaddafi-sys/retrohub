import urllib.request
import json

url = "https://wpfakkqvtotinrscqjyi.supabase.co/rest/v1/categories?select=*"
apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZmFra3F2dG90aW5yc2NxanlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzUxMTEsImV4cCI6MjA5Njc1MTExMX0.MUvZMo7J0lbeYZuUBkHtI3B5bGxAgknnqHIAlugFlh0"

req = urllib.request.Request(url)
req.add_header("apikey", apikey)
req.add_header("Authorization", f"Bearer {apikey}")

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode("utf-8"))
        print(f"Total categories in DB: {len(data)}")
        for idx, c in enumerate(data):
            print(f"{idx+1}. ID: {c.get('id')} | Name: {c.get('name')}")
except Exception as e:
    print("Error:", e)
