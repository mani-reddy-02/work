import os
import re
import subprocess

def main():
    print("Running tsc...")
    result = subprocess.run(["npx", "tsc", "--noEmit"], cwd="d:/MediQuee Hospital/frontend", capture_output=True, text=True)
    output = result.stdout + result.stderr
    print(output)
    
    # Pattern: src/components/lab/LabHeader.tsx(1,37): error TS6133: 'LogOut' is declared but its value is never read.
    # Pattern: src/pages/Profile.tsx(51,47): error TS2367: ...
    
    pattern = re.compile(r"^(src/[a-zA-Z0-9_/\-\.]+)\((\d+),\d+\): error TS6133: '([^']+)' is declared")
    
    fixes = {}
    for line in output.split('\n'):
        m = pattern.match(line.strip())
        if m:
            filepath, line_num, var_name = m.groups()
            line_num = int(line_num) - 1 # 0-indexed
            if filepath not in fixes:
                fixes[filepath] = []
            fixes[filepath].append((line_num, var_name))
            
    for filepath, edits in fixes.items():
        full_path = os.path.join("d:/MediQuee Hospital/frontend", filepath)
        if not os.path.exists(full_path):
            continue
            
        with open(full_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for line_num, var_name in edits:
            # We need to remove var_name from lines[line_num].
            # It could be `import { A, B, C }` or `const [var, setVar] = useState()`
            line_str = lines[line_num]
            
            # Simple replace: try removing it with comma
            line_str = re.sub(r'\b' + re.escape(var_name) + r'\b\s*,\s*', '', line_str)
            # Try removing it at the end of the list
            line_str = re.sub(r',\s*\b' + re.escape(var_name) + r'\b', '', line_str)
            # Try removing it if it's the only one inside braces
            line_str = re.sub(r'\{\s*\b' + re.escape(var_name) + r'\b\s*\}', '{}', line_str)
            # Try removing it if it's the only one import
            line_str = re.sub(r'import\s+\b' + re.escape(var_name) + r'\b\s+from', 'import from', line_str)
            
            # For useState: `const [var, setVar] = useState` -> if setVar is unused, we might need to remove it?
            # Actually if it's `setVideoList`, it's usually `const [videoList, setVideoList]`. We can just replace `setVideoList` with `_setVideoList`?
            # Let's just do a blanket regex replace of the word, if it's in an import list it works well.
            # If it's a state setter, better to comment it out or change to `_`
            if var_name.startswith('set'):
                line_str = re.sub(r'\b' + re.escape(var_name) + r'\b', '_' + var_name, line_str)
            
            lines[line_num] = line_str
            
        # Write back
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
            
    print("Done fixing unused vars.")
    
if __name__ == "__main__":
    main()
