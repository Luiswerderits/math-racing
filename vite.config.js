import { defineConfig } from 'vite';
export default defineConfig({base:process.env.GITHUB_ACTIONS?'/math-racing/':'/',test:{environment:'node',include:['tests/**/*.test.js']}});