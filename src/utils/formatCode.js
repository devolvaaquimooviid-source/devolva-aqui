function formatCode(code) {
  if (!code) return "";

  return code
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // remove tudo que não for letra/número
}

module.exports = formatCode;