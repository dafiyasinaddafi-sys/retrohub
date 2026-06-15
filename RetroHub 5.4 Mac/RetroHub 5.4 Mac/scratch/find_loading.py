import os

def search_files(directory, search_terms):
    results = []
    for root, dirs, files in os.walk(directory):
        if "node_modules" in root or ".git" in root or ".gemini" in root:
            continue
        for file in files:
            if file.endswith(('.js', '.html', '.css')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            for term in search_terms:
                                if term.lower() in line.lower():
                                    results.append((path, i+1, term, line.strip()))
                except Exception as e:
                    pass
    return results

if __name__ == '__main__':
    terms = ["cloud-loading", "loading-overlay", "retrohub-cloud-loading"]
    matches = search_files(".", terms)
    for m in matches:
        print(f"File: {m[0]} | Line: {m[1]} | Term: {m[2]}")
        print(f"  {m[3]}")
