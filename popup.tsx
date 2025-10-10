import { Storage } from "@plasmohq/storage"
import { useEffect, useState } from "react"

const storage = new Storage()

function IndexPopup() {
  const [focusModeEnabled, setFocusModeEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load the current focus mode state from storage
    const loadState = async () => {
      const enabled = await storage.get<boolean>("focusModeEnabled")
      setFocusModeEnabled(enabled ?? false)
      setIsLoading(false)
    }
    
    loadState()
  }, [])

  const handleToggle = async () => {
    const newState = !focusModeEnabled
    setFocusModeEnabled(newState)

    // Save the new state to storage
    await storage.set("focusModeEnabled", newState)

    // Notify all LinkedIn tabs about the state change
    const tabs = await chrome.tabs.query({
      url: ["https://www.linkedin.com/*"]
    })

    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: "FOCUS_MODE_CHANGED",
            enabled: newState
          },
          (response) => {
            // Handle any errors silently (e.g., if content script not loaded yet)
            if (chrome.runtime.lastError) {
              console.log(
                "Content script not ready yet, state will load on page refresh:",
                chrome.runtime.lastError.message
              )
            }
          }
        )
      }
    })
  }

  return (
    <div
      style={{
        width: 320,
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white"
      }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.5px"
          }}>
          In Toolkit
        </h1>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: 14,
            opacity: 0.9
          }}>
          Handy Toolkit for LinkedIn
        </p>
      </div>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: 12,
          padding: 16,
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600
              }}>
              Focus Mode
            </h3>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: 12,
                opacity: 0.8
              }}>
              {focusModeEnabled
                ? "Feed hidden with inspiration"
                : "LinkedIn feed visible"}
            </p>
          </div>

          <button
            onClick={handleToggle}
            disabled={isLoading}
            style={{
              position: "relative",
              width: 56,
              height: 32,
              borderRadius: 16,
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              background: focusModeEnabled
                ? "rgba(255, 255, 255, 0.9)"
                : "rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease",
              opacity: isLoading ? 0.5 : 1
            }}>
            <div
              style={{
                position: "absolute",
                top: 4,
                left: focusModeEnabled ? 28 : 4,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: focusModeEnabled
                  ? "#667eea"
                  : "rgba(255, 255, 255, 0.8)",
                transition: "left 0.3s ease",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              }}
            />
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: 8,
          fontSize: 11,
          opacity: 0.8,
          textAlign: "center"
        }}>
        Toggle Focus Mode to replace your LinkedIn feed with inspirational
        quotes
      </div>
    </div>
  )
}

export default IndexPopup
