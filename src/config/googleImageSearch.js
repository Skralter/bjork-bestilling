const googleImageSearchConfig = {
  apiKey: process.env.GOOGLE_CSE_API_KEY || "",
  searchEngineId: process.env.GOOGLE_CSE_ENGINE_ID || ""
};

function hasGoogleImageSearchCredentials() {
  return Boolean(googleImageSearchConfig.apiKey && googleImageSearchConfig.searchEngineId);
}

module.exports = {
  googleImageSearchConfig,
  hasGoogleImageSearchCredentials
};
