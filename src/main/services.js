const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const PRELOAD_PATH = require('path').join(__dirname, '..', '..', 'src', 'preload', 'spoof.js');

const SERVICES = [
  { id: 'gemini',     partition: 'persist:gemini' },
  { id: 'chatgpt',    partition: 'persist:chatgpt' },
  { id: 'claude',     partition: 'persist:claude' },
  { id: 'kimi',       partition: 'persist:kimi' },
  { id: 'deepseek',   partition: 'persist:deepseek' },
  { id: 'qwen',       partition: 'persist:qwen' },
  { id: 'mistral',    partition: 'persist:mistral' },
  { id: 'grok',       partition: 'persist:grok' },
  { id: 'z',          partition: 'persist:z' },
  { id: 'copilot',    partition: 'persist:copilot' },
  { id: 'perplexity', partition: 'persist:perplexity' },
  { id: 'meta',       partition: 'persist:meta' },
  { id: 'luzia',      partition: 'persist:luzia' },
];

module.exports = {
  CHROME_UA,
  PRELOAD_PATH,
  SERVICES
};