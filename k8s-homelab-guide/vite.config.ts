import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { execSync } from 'child_process';

let commitHash = 'unknown';
let branchName = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD 2>/dev/null').toString().trim();
  branchName = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null').toString().trim();
} catch (e) {
  // Ignore errors if git is not available or not in a git repo
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__GIT_COMMIT__': JSON.stringify(commitHash),
      '__GIT_BRANCH__': JSON.stringify(branchName),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
