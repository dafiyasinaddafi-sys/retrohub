import re

def check_braces(filename):
    print(f"Checking {filename}...")
    content = open(filename, 'r', encoding='utf-8').read()

    stack = []
    in_string = False
    in_template = False
    string_char = None
    escape = False
    in_single_comment = False
    in_multi_comment = False

    template_braces_stack = []

    line_num = 1
    col_num = 0

    i = 0
    while i < len(content):
        char = content[i]
        
        if char == '\n':
            line_num += 1
            col_num = 0
        else:
            col_num += 1

        if escape:
            escape = False
            i += 1
            continue
        if char == '\\':
            escape = True
            i += 1
            continue

        if in_single_comment:
            if char == '\n':
                in_single_comment = False
            i += 1
            continue
        if in_multi_comment:
            if char == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_multi_comment = False
                i += 2
                continue
            i += 1
            continue

        if not in_string and not in_template:
            if char == '/' and i + 1 < len(content) and content[i+1] == '/':
                in_single_comment = True
                i += 2
                continue
            if char == '/' and i + 1 < len(content) and content[i+1] == '*':
                in_multi_comment = True
                i += 2
                continue

        if in_string:
            if char == string_char:
                in_string = False
        elif in_template:
            if char == '`':
                in_template = False
            elif char == '$' and i + 1 < len(content) and content[i+1] == '{':
                template_braces_stack.append(True)
                i += 2
                stack.append((line_num, col_num, '${'))
                continue
            elif char == '}' and template_braces_stack:
                template_braces_stack.pop()
                if stack and stack[-1][2] == '${':
                    stack.pop()
        else:
            if char in ["'", '"']:
                in_string = True
                string_char = char
            elif char == '`':
                in_template = True
            elif char == '{':
                stack.append((line_num, col_num, '{'))
            elif char == '}':
                if stack and stack[-1][2] == '{':
                    stack.pop()
                else:
                    print(f"Extra }} at line {line_num}, col {col_num}")
        i += 1

    print('Unclosed count:', len(stack))
    for s in stack:
        print(f"Unclosed {s[2]} opened at line {s[0]}, col {s[1]}")

if __name__ == '__main__':
    check_braces('db.js')
