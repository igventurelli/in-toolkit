chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_QUOTE") {
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

    return true
  } else if (request.type === "GET_ICON_URL") {
    sendResponse({ iconUrl: chrome.runtime.getURL("icon48.plasmo.a78c509e.png") })
    return true
  }
})

