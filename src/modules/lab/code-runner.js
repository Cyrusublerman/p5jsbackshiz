const FORBIDDEN_TOKENS = [
  'window',
  'document',
  'globalThis',
  'Function(',
  'eval(',
  'import(',
  'XMLHttpRequest',
  'fetch('
];

function assertSafe(code) {
  for (const token of FORBIDDEN_TOKENS) {
    if (code.includes(token)) throw new Error(`Sandbox violation: ${token}`);
  }
}

export async function runSandboxedCode({ setup = '', draw = '() => null', timeoutMs = 50, api = {} } = {}) {
  const mergedApi = { Math, ...api };
  const apiKeys = Object.keys(mergedApi);

  assertSafe(setup);
  assertSafe(draw);

  const exec = async () => {
    const factory = new Function(...apiKeys, '"use strict";\n' + setup + '\nreturn (' + draw + ');');
    return factory(...apiKeys.map((k) => mergedApi[k]));
  };

  return Promise.race([
    exec(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Sandbox timeout exceeded')), timeoutMs))
  ]);
}
