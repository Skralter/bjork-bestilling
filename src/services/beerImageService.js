const {
  googleImageSearchConfig,
  hasGoogleImageSearchCredentials
} = require("../config/googleImageSearch");

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9æøå]+/gi, " ")
    .trim();
}

function isStrictBeerMatch({ title, snippet, link }, breweryName, beerName) {
  const haystack = normalizeText([title, snippet, link].filter(Boolean).join(" "));
  const normalizedBeer = normalizeText(beerName);
  const normalizedBrewery = normalizeText(breweryName);

  if (!normalizedBeer) {
    return false;
  }

  if (!haystack.includes(normalizedBeer)) {
    return false;
  }

  if (normalizedBrewery && !haystack.includes(normalizedBrewery)) {
    return false;
  }

  return true;
}

async function fetchBeerImageFromGoogle({ breweryName, beerName }) {
  if (!hasGoogleImageSearchCredentials()) {
    return null;
  }

  const query = [breweryName, beerName, "beer can"].filter(Boolean).join(" ").trim();
  if (!query) {
    return null;
  }

  const url = new URL("https://customsearch.googleapis.com/customsearch/v1");
  url.searchParams.set("key", googleImageSearchConfig.apiKey);
  url.searchParams.set("cx", googleImageSearchConfig.searchEngineId);
  url.searchParams.set("q", query);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("num", "5");
  url.searchParams.set("safe", "active");
  url.searchParams.set("imgType", "photo");

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];

  const strictMatch = items.find((item) =>
    isStrictBeerMatch(
      {
        title: item.title,
        snippet: item.snippet,
        link: item.link
      },
      breweryName,
      beerName
    )
  );

  if (!strictMatch?.link) {
    return null;
  }

  return {
    imageUrl: strictMatch.link,
    attribution: "Bilde funnet via Google Programmable Search"
  };
}

module.exports = {
  fetchBeerImageFromGoogle
};
