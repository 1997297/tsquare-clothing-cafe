// Local browser-test transpilation only; never part of the Next.js application.
const ts = require('typescript');
module.exports = function (source) {
  return ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText;
};
