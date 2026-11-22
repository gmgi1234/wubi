// Build dist/app.js from src/app.js.
// Minification only (no bundling, no IIFE wrap) so that inline onclick="..."
// handlers keep finding the global function names.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const ESBUILD = 'D:/Users/10061/Downloads/ZLM/remotion-space-geometry/node_modules/esbuild';

const source = readFileSync(new URL('./src/app.js', import.meta.url), 'utf8');
let code = source;
try {
  const esbuild = require(ESBUILD);
  const result = await esbuild.transform(source, {
    loader: 'js',
    minify: true,
    target: 'es2018',
    legalComments: 'none',
  });
  code = result.code;
  console.log('minified with esbuild', (source.length / 1024).toFixed(0) + 'KB ->', (code.length / 1024).toFixed(0) + 'KB');
} catch (error) {
  console.warn('esbuild unavailable, copying source as-is:', error.message);
}

if (!code.includes('setWubiVersion')) {
  throw new Error('minified output lost the global handler names; refusing to write');
}

mkdirSync(new URL('./dist/', import.meta.url), {recursive: true});
writeFileSync(new URL('./dist/app.js', import.meta.url), code, 'utf8');
console.log('wrote dist/app.js');
