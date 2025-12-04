const extractCsrfToken = (res) => {
  if (!res.text) return null;
  const match = res.text.match(/name="_csrf" value="([^"]+)"/);
  return match ? match[1] : null;
};

module.exports = { extractCsrfToken };
