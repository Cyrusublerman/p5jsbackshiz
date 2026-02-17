// Curated module metadata (manual LLM review of source snapshot)
export const TOOL_SOURCE_PATH = "toIntegrate/lones/lones/src/index.html";
export const TOOL_EXTRACTION_MODE = "manual-llm-review";
export const TOOL_FUNCTION_NAMES = [
  "setup",
  "draw",
  "windowResized",
  "handleFileDrop",
  "handleFileInputChange",
  "loadSourceImage",
  "setEngineMode",
  "rebuildLines",
  "renderFlowLines",
  "renderStaticLines",
  "renderSerpentineLines",
  "updateControlPanel",
  "updateAnimationProgress",
  "togglePause",
  "resetState",
  "exportPng",
  "exportSvg",
  "startRecording",
  "stopRecording",
  "applyDragResponse",
  "applyLineTension"
];
export const TOOL_REGEX_FUNCTION_NAMES = [];
export const TOOL_LLM_FUNCTION_NAMES = TOOL_FUNCTION_NAMES;
export const TOOL_LLM_CAPABILITIES = [
  "p5 lifecycle rendering",
  "flow/static/serpentine engine switching",
  "image import and fit-mode controls",
  "line tension and drag response tuning",
  "animation progress control",
  "png/svg export and recording controls"
];
export const TOOL_LLM_NOTES = "Source snapshot contains complete UI/control surface but no inline executable script block. Function names are manually inferred from the control contract and expected p5 lifecycle behavior for this tool.";
export const TOOL_SOURCE_TEXT = "Manual LLM review performed directly against HTML control surface (no inline script body available in snapshot).";
export const TOOL_FUNCTIONS = Object.fromEntries(TOOL_FUNCTION_NAMES.map((n) => [n, null]));
