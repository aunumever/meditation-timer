// Global mock for require() calls on sound assets
// Vitest can't resolve .mp3 files in Node environment
const Module = require("module");
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id: string) {
  if (id.endsWith(".mp3") || id.endsWith(".m4a")) {
    return 0; // Return a dummy asset number
  }
  return originalRequire.apply(this, arguments);
};
