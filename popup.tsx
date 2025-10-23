import { Storage } from "@plasmohq/storage"
import { useEffect, useState } from "react"

import iconUrl from "data-base64:~assets/icon.png"

const storage = new Storage()

function IndexPopup() {
  const [focusModeEnabled, setFocusModeEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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

    await storage.set("focusModeEnabled", newState)
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
        width: 360,
        minHeight: 200,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "#ffffff",
        color: "#1a1a1a"
      }}>
      {/* Header */}
      <div
        style={{
          padding: "24px 24px 20px",
          borderBottom: "1px solid #f0f0f0"
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={iconUrl}
            alt="In Toolkit"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10
            }}
          />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.3px",
                color: "#1a1a1a"
              }}>
              In Toolkit
            </h1>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: 13,
                color: "#6b7280",
                fontWeight: 400
              }}>
              LinkedIn productivity tools
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px 24px" }}>
        {/* Focus Mode Card */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: 12,
            padding: "16px 18px",
            border: "1px solid #f0f0f0",
            transition: "all 0.2s ease"
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#1a1a1a"
                  }}>
                  Focus Mode
                </h3>
                {focusModeEnabled && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgb(7, 68, 117)",
                      color: "white",
                      fontWeight: 500
                    }}>
                    Active
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: 13,
                  color: "#6b7280",
                  lineHeight: 1.4
                }}>
                {focusModeEnabled
                  ? "Feed replaced with daily inspiration"
                  : "Show your LinkedIn feed"}
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={handleToggle}
              disabled={isLoading}
              style={{
                position: "relative",
                width: 48,
                height: 28,
                borderRadius: 14,
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                background: focusModeEnabled ? "rgb(7, 68, 117)" : "#d1d5db",
                transition: "all 0.3s ease",
                opacity: isLoading ? 0.5 : 1,
                flexShrink: 0,
                marginLeft: 12
              }}>
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: focusModeEnabled ? 23 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#ffffff",
                  transition: "left 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
