import urllib.request
import json

url = "https://wpfakkqvtotinrscqjyi.supabase.co/rest/v1/products?select=*"
apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZmFra3F2dG90aW5yc2NxanlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzUxMTEsImV4cCI6MjA5Njc1MTExMX0.MUvZMo7J0lbeYZuUBkHtI3B5bGxAgknnqHIAlugFlh0"

req = urllib.request.Request(url)
req.add_header("apikey", apikey)
req.add_header("Authorization", f"Bearer {apikey}")

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode("utf-8"))
        for p in data:
            diagnostics = {
                "id": p.get("id"),
                "title": p.get("title"),
                "status": p.get("status"),
                "category_id": p.get("category_id"),
                "price": p.get("price"),
                "starting_bid": p.get("starting_bid"),
                "transaction_type": p.get("transaction_type"),
                "seller_id": p.get("seller_id"),
                "image_url_length": len(p.get("image_url")) if p.get("image_url") else 0,
                "image_urls_length": len(p.get("image_urls")) if p.get("image_urls") else 0,
                "images_length": len(p.get("images")) if p.get("images") else 0
            }
            print(json.dumps(diagnostics))
except Exception as e:
    print("Error:", e)
