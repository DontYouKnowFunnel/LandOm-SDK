import esbuild from 'rollup-plugin-esbuild';
import resolve from '@rollup/plugin-node-resolve';

const input = 'src/index.ts';

export default [
  // ESM
  {
    input,
    output: {
      file: 'dist/landom-sdk.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [resolve(), esbuild({ target: 'es2018' })],
  },
  // CJS
  {
    input,
    output: {
      file: 'dist/landom-sdk.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [resolve(), esbuild({ target: 'es2018' })],
  },
  // UMD
  {
    input,
    output: {
      file: 'dist/landom-sdk.umd.js',
      format: 'umd',
      name: 'LandOm',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [resolve(), esbuild({ target: 'es2018' })],
  },
];
