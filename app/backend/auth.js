function isValidToken(value, expectedToken, now = Math.floor(Date.now() / 1000)) {
  if (typeof value !== "string" || typeof expectedToken !== "string") {
    return false;
  }
  const [token, expiry, ...extra] = value.split(".");
  if (extra.length > 0 || !/^\d+$/.test(expiry || "")) {
    return false;
  }
  return token === expectedToken && Number(expiry) > now;
}

module.exports = { isValidToken };
