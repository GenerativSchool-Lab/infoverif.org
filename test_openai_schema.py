#!/usr/bin/env python3
"""Test OpenAI json_schema mode locally or with Railway env."""
import os
import json
from openai import OpenAI

# Try to load from .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("ERROR: OPENAI_API_KEY not set")
    print("Set it with: export OPENAI_API_KEY='sk-...'")
    exit(1)

client = OpenAI(api_key=api_key)

test_prompt = """Analyze this content for propaganda, conspiracy, and misinformation.

METADATA:
Title: Test
Description: Test content
Platform: text

CONTENT:
Breaking news! The government is hiding the truth about vaccines. They don't want you to know what is really happening. Wake up sheeple!
"""

print("Testing OpenAI json_schema mode...")
print("=" * 60)

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert media analyst. Return ONLY valid JSON matching the schema."},
            {"role": "user", "content": test_prompt}
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "analysis_result",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "propaganda_score": {"type": "integer"},
                        "conspiracy_score": {"type": "integer"},
                        "misinfo_score": {"type": "integer"},
                        "overall_risk": {"type": "integer"},
                        "techniques": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "evidence": {"type": "string"},
                                    "severity": {"type": "string"}
                                },
                                "required": ["name", "evidence", "severity"],
                                "additionalProperties": False
                            }
                        },
                        "claims": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "claim": {"type": "string"},
                                    "confidence": {"type": "string"},
                                    "issues": {"type": "array", "items": {"type": "string"}}
                                },
                                "required": ["claim", "confidence", "issues"],
                                "additionalProperties": False
                            }
                        },
                        "summary": {"type": "string"}
                    },
                    "required": [
                        "propaganda_score",
                        "conspiracy_score",
                        "misinfo_score",
                        "overall_risk",
                        "techniques",
                        "claims",
                        "summary"
                    ],
                    "additionalProperties": False
                }
            }
        },
        temperature=0
    )
    
    content = response.choices[0].message.content
    print("RAW RESPONSE:")
    print(content)
    print("=" * 60)
    
    parsed = json.loads(content)
    print("PARSED JSON:")
    print(json.dumps(parsed, indent=2))
    print("=" * 60)
    print("✓ SUCCESS: Schema validation passed")
    
except Exception as e:
    print(f"✗ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

