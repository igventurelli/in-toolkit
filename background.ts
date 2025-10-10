// Background service worker to handle API calls that would be blocked by CORS in content scripts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_QUOTE") {
    // Fetch quote from ZenQuotes API
    fetch("https://zenquotes.io/api/random")
      .then((response) => response.json())
      .then((data) => {
        if (data && data[0]) {
          sendResponse({ success: true, quote: data[0] })
        } else {
          sendResponse({
            success: false,
            error: "Invalid response from API"
          })
        }
      })
      .catch((error) => {
        console.error("API fetch error:", error)
        sendResponse({
          success: false,
          error: error.message
        })
      })

    // Return true to indicate we'll respond asynchronously
    return true
  }
})

