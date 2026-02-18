#!/usr/bin/env python3
from pathlib import Path
import json
import re
import argparse
import os
from urllib import request, error

ROOT = Path(__file__).resolve().parents[1]
OUT_BASE = ROOT / 'src/modules/tointegrate'

TOOL_CANDIDATES = {
    'colourquantiser': [
        'toIntegrate/colourquantiser/colourquantiser/src/script.js',
        'toIntegrate/colourquantiser/colourquantiser/src/index (2).html',
        'toIntegrate/colourquantiser/colourquantiser/src/index.html',
    ],
    'paint-image': [
        'toIntegrate/paint-image/paint-image/src/script.js',
        'toIntegrate/paint-image/paint-image/src/index (2).html',
        'toIntegrate/paint-image/paint-image/src/index.html',
    ],
    'tile2': [
        'toIntegrate/tile2/tile2/src/script.js',
        'toIntegrate/tile2/tile2/src/index (2).html',
        'toIntegrate/tile2/tile2/src/index.html',
    ],
    'luminance-distortion': [
        'toIntegrate/luminance-distortion.html',
        'toIntegrate/luminance-distortion (2).html',
    ],
    'distortion-pipeline': [
        'toIntegrate/distortion-pipeline.html',
        'toIntegrate/distortion-pipeline (2).html',
    ],
    'index-1': [
        'toIntegrate/index (1).html',
        'toIntegrate/index (2).html',
    ],
    'lones': [
        'toIntegrate/lones/lones/src/index (2).html',
        'toIntegrate/lones/lones/src/index.html',
        'toIntegrate/lones/lones/dist/index.html',
    ],
    'processing-export': [
        'toIntegrate/processing-export/processing-export/src/index (2).html',
        'toIntegrate/processing-export/processing-export/src/index.html',
    ],
}


def pick_source(candidates):
    for rel in candidates:
        p = ROOT / rel
        if p.exists():
            return rel
    return candidates[0]


def extract_names(text):
    names = []
    for m in re.finditer(r'function\s+([A-Za-z_$][\w$]*)\s*\(', text):
        n = m.group(1)
        if n not in names:
            names.append(n)
    for m in re.finditer(r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>', text):
        n = m.group(1)
        if n not in names:
            names.append(n)
    return names


def parse_json_object(value):
    if not value:
        return None
    value = value.strip()
    if value.startswith('```'):
        value = re.sub(r'^```(?:json)?\s*', '', value)
        value = re.sub(r'\s*```$', '', value)
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        m = re.search(r'\{[\s\S]*\}', value)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            return None


def llm_extract(tool, text, model):
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return None

    prompt = (
        "You extract code metadata from legacy HTML/JS files. "
        "Return JSON only with keys: functions (array of unique callable function names), "
        "capabilities (array of short phrases), notes (string). "
        "Infer function names from declarations, assigned function expressions, and key methods. "
        "Ignore browser globals and library APIs."
    )

    payload = {
        'model': model,
        'input': [
            {
                'role': 'system',
                'content': [
                    {'type': 'input_text', 'text': prompt},
                ],
            },
            {
                'role': 'user',
                'content': [
                    {'type': 'input_text', 'text': f"tool: {tool}\n\nSOURCE:\n{text[:120000]}"},
                ],
            },
        ],
        'text': {
            'format': {
                'type': 'json_schema',
                'name': 'tool_metadata',
                'schema': {
                    'type': 'object',
                    'additionalProperties': False,
                    'properties': {
                        'functions': {
                            'type': 'array',
                            'items': {'type': 'string'},
                        },
                        'capabilities': {
                            'type': 'array',
                            'items': {'type': 'string'},
                        },
                        'notes': {'type': 'string'},
                    },
                    'required': ['functions', 'capabilities', 'notes'],
                },
            }
        },
    }

    req = request.Request(
        'https://api.openai.com/v1/responses',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with request.urlopen(req, timeout=60) as res:
            body = json.loads(res.read().decode('utf-8'))
    except (error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    output_text = body.get('output_text')
    parsed = parse_json_object(output_text)
    if not parsed:
        return None

    llm_names = []
    for name in parsed.get('functions', []):
        if isinstance(name, str) and name and name not in llm_names:
            llm_names.append(name)

    capabilities = [c for c in parsed.get('capabilities', []) if isinstance(c, str) and c]
    notes = parsed.get('notes', '') if isinstance(parsed.get('notes', ''), str) else ''

    return {
        'functionNames': llm_names,
        'capabilities': capabilities,
        'notes': notes,
    }


def source_text(rel):
    p = ROOT / rel
    raw = p.read_text(encoding='utf-8', errors='ignore') if p.exists() else ''
    if rel.endswith('.html'):
        scripts = '\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>', raw, re.I))
        return scripts if scripts.strip() else raw
    return raw


def write_tool(tool, selected_rel, candidates, llm_mode='auto', llm_model='gpt-4.1-mini'):
    text = source_text(selected_rel)
    regex_names = extract_names(text)
    llm_meta = None
    if llm_mode in ('auto', 'required'):
        llm_meta = llm_extract(tool, text, llm_model)
        if llm_mode == 'required' and not llm_meta:
            raise RuntimeError(f'LLM parsing was required but unavailable for tool: {tool}')

    llm_names = llm_meta['functionNames'] if llm_meta else []
    names = []
    for name in llm_names + regex_names:
        if name not in names:
            names.append(name)

    extraction_mode = 'regex+llm' if llm_meta else 'regex-only'
    tdir = OUT_BASE / tool
    tdir.mkdir(parents=True, exist_ok=True)

    (tdir / 'functions.js').write_text(
        "// Extracted metadata module (safe text representation)\n"
        f"export const TOOL_SOURCE_PATH = {json.dumps(selected_rel)};\n"
        f"export const TOOL_EXTRACTION_MODE = {json.dumps(extraction_mode)};\n"
        f"export const TOOL_FUNCTION_NAMES = {json.dumps(names, indent=2)};\n"
        f"export const TOOL_REGEX_FUNCTION_NAMES = {json.dumps(regex_names, indent=2)};\n"
        f"export const TOOL_LLM_FUNCTION_NAMES = {json.dumps(llm_names, indent=2)};\n"
        f"export const TOOL_LLM_CAPABILITIES = {json.dumps(llm_meta['capabilities'] if llm_meta else [], indent=2)};\n"
        f"export const TOOL_LLM_NOTES = {json.dumps(llm_meta['notes'] if llm_meta else '')};\n"
        f"export const TOOL_SOURCE_TEXT = {json.dumps(text)};\n"
        "export const TOOL_FUNCTIONS = Object.fromEntries(TOOL_FUNCTION_NAMES.map((n) => [n, null]));\n",
        encoding='utf-8'
    )

    manifest = {
        'tool': tool,
        'source': selected_rel,
        'sourceCandidates': candidates,
        'sourceExists': bool((ROOT / selected_rel).exists()),
        'extractionMode': extraction_mode,
        'regexFunctionCount': len(regex_names),
        'llmFunctionCount': len(llm_names),
        'llmCapabilities': llm_meta['capabilities'] if llm_meta else [],
        'llmNotes': llm_meta['notes'] if llm_meta else '',
        'functionCount': len(names),
        'functions': names,
    }
    (tdir / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    return manifest


def main():
    parser = argparse.ArgumentParser(description='Extract toIntegrate metadata modules')
    parser.add_argument('--llm', choices=['off', 'auto', 'required'], default='auto')
    parser.add_argument('--llm-model', default='gpt-4.1-mini')
    args = parser.parse_args()

    OUT_BASE.mkdir(parents=True, exist_ok=True)
    manifests = []
    for tool, cands in TOOL_CANDIDATES.items():
        selected = pick_source(cands)
        manifests.append(write_tool(tool, selected, cands, llm_mode=args.llm, llm_model=args.llm_model))

    lines = [
        '# toIntegrate Function Extraction Report\n\n',
        'Generated modules for all 8 tool sources.\n\n',
        '| Tool | Source | Mode | Regex names | LLM names | Total names |\n',
        '|---|---|---|---:|---:|---:|\n',
    ]
    for m in manifests:
        lines.append(
            f"| {m['tool']} | `{m['source']}` | {m['extractionMode']} | {m['regexFunctionCount']} | {m['llmFunctionCount']} | {m['functionCount']} |\n"
        )

    lines.append('\nLimitations:\n')
    lines.append('- LLM parsing runs only when `OPENAI_API_KEY` is available (or `--llm off` is not used). Otherwise the extractor safely falls back to regex-only mode.\n')
    lines.append('- Some tool snapshots may contain no inline/local script function declarations; extraction count can be zero until source script blocks are present.\n')
    lines.append('- If `index (2).html` exists for a tool, extractor now prefers it automatically.\n')

    report = ROOT / 'docs/migration/tointegrate-function-extraction-report.md'
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(''.join(lines), encoding='utf-8')


if __name__ == '__main__':
    main()
