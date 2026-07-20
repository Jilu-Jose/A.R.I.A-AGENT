import json
import os

transcript_path = r"C:\Users\hp\.gemini\antigravity-ide\brain\7116fa8e-9262-44e2-99fe-059f0681f51f\.system_generated\logs\transcript_full.jsonl"

dashboard_content = None

if os.path.exists(transcript_path):
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        if tc['name'] == 'write_to_file':
                            args = tc.get('args', {})
                            if 'dashboard.py' in args.get('TargetFile', ''):
                                dashboard_content = args.get('CodeContent', '')
                        elif tc['name'] == 'replace_file_content' or tc['name'] == 'multi_replace_file_content':
                            pass # We need the output of view_file to get the full file, or just look for the last view_file output!
                if data.get('source') == 'USER_EXPLICIT' and data.get('type') == 'VIEW_FILE':
                    content = data.get('content', '')
                    if 'dashboard.py' in content:
                        # This might contain the file content
                        pass
                
                # If we made a tool call response for view_file
                if data.get('type') == 'TOOL_RESPONSE':
                    content = data.get('content', '')
                    if 'dashboard.py' in content and 'File Path:' in content:
                        # Extract the file lines
                        lines = content.split('\n')
                        file_lines = []
                        is_code = False
                        for l in lines:
                            if l.startswith('1: '):
                                is_code = True
                            if is_code:
                                if ': ' in l:
                                    parts = l.split(': ', 1)
                                    if parts[0].isdigit():
                                        file_lines.append(parts[1])
                                    else:
                                        file_lines.append(l)
                                else:
                                    file_lines.append(l)
                        if file_lines:
                            dashboard_content = '\n'.join(file_lines)

            except Exception as e:
                pass

if dashboard_content:
    with open(r"c:\Project-A.R.I.A\research-digest\app\routes\dashboard_recovered.py", "w", encoding='utf-8') as f:
        f.write(dashboard_content)
    print("Recovered!")
else:
    print("Not found.")
