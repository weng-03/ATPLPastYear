import csv
import json
import os
import urllib.request

# Read env variables from .env.local
env_vars = {}
with open('.env.local', 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            if '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()

supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')

csv_file_path = 'questions-data/AirLaw_temp.csv'

# Read existing questions from Supabase for AirLaw or Air Law
# To avoid duplicates, we will just fetch all AirLaw/Air Law questions and build a map of question_number -> id
headers = {
    'apikey': supabase_key,
    'Authorization': f'Bearer {supabase_key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def query_supabase():
    url = f"{supabase_url}/rest/v1/questions?chapter=in.(AirLaw,Air%20Law)&select=id,chapter,question_number"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

existing_questions = query_supabase()
# map by question_number
existing_map = {q['question_number']: q for q in existing_questions}

to_insert = []
to_update = []

with open(csv_file_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Format chapter to 'Air Law' to look better in UI, or keep 'AirLaw' if that's what's preferred.
        # Let's use 'Air Law' as it's standard.
        chapter = 'Air Law'
        q_num = int(row['question_number'])
        
        payload = {
            'chapter': chapter,
            'question_number': q_num,
            'question_text': row['question_text'],
            'option_a': row['option_a'],
            'option_b': row['option_b'],
            'option_c': row['option_c'],
            'option_d': row['option_d'],
            'correct_answer': row['correct_answer'],
            'explanation': row['explanation']
        }
        
        if q_num in existing_map:
            # Update existing
            payload['id'] = existing_map[q_num]['id']
            to_update.append(payload)
        else:
            # Insert new
            to_insert.append(payload)

print(f"Found {len(to_update)} questions to update, {len(to_insert)} to insert.")

# Upsert (Supabase POST with Prefer: resolution=merge-duplicates)
# Wait, for upsert, we need to POST to the endpoint.
# Actually we can just POST everything. The ID will handle updates if provided.

def bulk_upsert(records):
    if not records: return
    # Break into batches of 100
    for i in range(0, len(records), 100):
        batch = records[i:i+100]
        url = f"{supabase_url}/rest/v1/questions"
        req = urllib.request.Request(url, data=json.dumps(batch).encode(), headers={
            **headers,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
        }, method='POST')
        try:
            with urllib.request.urlopen(req) as response:
                pass
            print(f"Upserted batch {i//100 + 1}")
        except urllib.error.HTTPError as e:
            print(f"HTTPError on batch {i//100 + 1}: {e.read().decode()}")

bulk_upsert(to_update)
bulk_upsert(to_insert)

print("Done uploading explanations to Supabase.")
