import urllib.request
import json

url = "https://wpfakkqvtotinrscqjyi.supabase.co/rest/v1/profiles?select=*"
apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZmFra3F2dG90aW5yc2NxanlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzUxMTEsImV4cCI6MjA5Njc1MTExMX0.MUvZMo7J0lbeYZuUBkHtI3B5bGxAgknnqHIAlugFlh0"

req = urllib.request.Request(url)
req.add_header("apikey", apikey)
req.add_header("Authorization", f"Bearer {apikey}")

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode("utf-8"))
        print(f"Total profiles in DB: {len(data)}")
        for idx, p in enumerate(data):
            print(f"{idx+1}. ID: {p.get('id')} | Name: {p.get('full_name')} | StoreName: {p.get('store_name')} | IsSeller: {p.get('is_seller')} | Status: {p.get('seller_status')} | IsBanned: {p.get('is_banned', False)}")
except Exception as e:
    print("Error:", e)
