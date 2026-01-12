module.exports = function stripTypeExportsLoader(source) {
  return source
    .replace(/^\s*export\s+type\s+[^;]+;?\s*$/gm, '')
    .replace(/^\s*import\s+type\s+[^;]+;?\s*$/gm, '')
}
