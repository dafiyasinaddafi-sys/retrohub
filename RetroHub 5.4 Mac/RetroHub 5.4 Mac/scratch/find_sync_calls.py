import os

def search_calls(directory, term):
    results = []
    for root, dirs, files in os.walk(directory):
        if "node_modules" in root or ".git" in root or ".gemini" in root:
            continue
        for file in files:
            if file.endswith(('.js', '.html')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        for idx, line in enumerate(f):
                            if term in line:
                                results.append((path, idx+1, line.strip()))
                except:
                    pass
    return results

if __name__ == '__main__':
    for r in search_calls('.', 'syncDatabaseLive'):
        print(f"File: {r[0]} | Line: {r[1]} | Content: {r[2]}")
