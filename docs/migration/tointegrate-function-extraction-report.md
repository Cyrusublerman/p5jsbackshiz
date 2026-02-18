# toIntegrate Function Extraction Report

Generated modules for all 8 tool sources.

| Tool | Source | Mode | Regex names | LLM names | Total names |
|---|---|---|---:|---:|---:|
| colourquantiser | `toIntegrate/colourquantiser/colourquantiser/src/script.js` | regex-only | 26 | 0 | 26 |
| paint-image | `toIntegrate/paint-image/paint-image/src/script.js` | regex-only | 3 | 0 | 3 |
| tile2 | `toIntegrate/tile2/tile2/src/script.js` | regex-only | 23 | 0 | 23 |
| luminance-distortion | `toIntegrate/luminance-distortion.html` | regex-only | 3 | 0 | 3 |
| distortion-pipeline | `toIntegrate/distortion-pipeline.html` | regex-only | 5 | 0 | 5 |
| index-1 | `toIntegrate/index (1).html` | regex-only | 3 | 0 | 3 |
| lones | `toIntegrate/lones/lones/src/index.html` | manual-llm-review | 0 | 21 | 21 |
| processing-export | `toIntegrate/processing-export/processing-export/src/index.html` | regex-only | 4 | 0 | 4 |

Limitations:
- Where source snapshots include only UI markup and no inline executable script, function metadata may be produced from manual LLM review of control contracts.
- LLM parsing runs only when `OPENAI_API_KEY` is available (or `--llm off` is not used). Otherwise the extractor safely falls back to regex-only mode.
- Some tool snapshots may contain no inline/local script function declarations; extraction count can be zero until source script blocks are present.
- If `index (2).html` exists for a tool, extractor now prefers it automatically.
