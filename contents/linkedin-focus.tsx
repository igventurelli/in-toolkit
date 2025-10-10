import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { useEffect, useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"],
  all_frames: false
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  // Wait for the feed container to be available
  const waitForElement = (selector: string): Promise<Element> => {
    return new Promise((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(selector)
        if (element) {
          resolve(element)
        } else {
          setTimeout(checkElement, 100)
        }
      }
      checkElement()
    })
  }

  // Find the main feed container
  const feedContainer = await waitForElement("main")
  return feedContainer as Element
}

interface Quote {
  q: string
  a: string
  h: string
}

const storage = new Storage()

const LinkedInFocus = () => {
  const [focusModeEnabled, setFocusModeEnabled] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch a quote from ZenQuotes API via background script
  const fetchQuote = async () => {
    try {
      // Send message to background script to fetch quote (avoids CORS issues)
      chrome.runtime.sendMessage(
        { type: "FETCH_QUOTE" },
        (response: { success: boolean; quote?: Quote; error?: string }) => {
          if (response && response.success && response.quote) {
            setQuote(response.quote)
          } else {
            console.error("Failed to fetch quote:", response?.error)
            // Fallback quote if API fails
            setQuote({
              q: "The secret of getting ahead is getting started.",
              a: "Mark Twain",
              h: ""
            })
          }
        }
      )
    } catch (error) {
      console.error("Error fetching quote:", error)
      // Fallback quote if API fails
      setQuote({
        q: "The secret of getting ahead is getting started.",
        a: "Mark Twain",
        h: ""
      })
    }
  }

  // Load initial state and fetch quote
  useEffect(() => {
    const loadState = async () => {
      const enabled = await storage.get<boolean>("focusModeEnabled")
      setFocusModeEnabled(Boolean(enabled))
      setIsLoading(false)
      if (enabled) {
        fetchQuote()
      }
    }

    loadState()

    // Listen for messages from the popup
    const messageListener = (
      message: { type: string; enabled: boolean },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.type === "FOCUS_MODE_CHANGED") {
        setFocusModeEnabled(message.enabled)
        if (message.enabled) {
          fetchQuote()
        }
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  // Hide/show the original feed content
  useEffect(() => {
    if (isLoading) return

    const mainElement = document.querySelector("main") as HTMLElement
    if (!mainElement) return

    // Hide all direct children of main (the original feed content)
    const children = Array.from(mainElement.children) as HTMLElement[]
    children.forEach((child) => {
      // Don't hide our Plasmo injected content
      if (!child.id?.includes("plasmo")) {
        if (focusModeEnabled) {
          child.style.display = "none"
        } else {
          child.style.display = ""
        }
      }
    })
  }, [focusModeEnabled, isLoading])

  if (!focusModeEnabled || isLoading) {
    return null
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        padding: "60px 40px",
        width: "100%"
      }}>
      <div
        style={{
          maxWidth: "700px",
          textAlign: "center",
          color: "white",
          padding: "0 20px"
        }}>
        <div
          style={{
            fontSize: 48,
            marginBottom: 32,
            opacity: 0.9
          }}>
          🎯
        </div>

        {quote ? (
          <>
            <blockquote
              style={{
                fontSize: 32,
                lineHeight: 1.5,
                fontWeight: 300,
                margin: "0 0 24px 0",
                fontStyle: "italic",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}>
              "{quote.q}"
            </blockquote>
            <footer
              style={{
                fontSize: 20,
                fontWeight: 500,
                opacity: 0.9,
                marginBottom: 50
              }}>
              — {quote.a}
            </footer>
          </>
        ) : (
          <div
            style={{
              fontSize: 24,
              opacity: 0.8,
              marginBottom: 50
            }}>
            Loading inspiration...
          </div>
        )}

        <div
          style={{
            padding: 20,
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            fontSize: 14,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            marginBottom: 24
          }}>
          <p style={{ margin: "0 0 8px 0", opacity: 0.9 }}>
            Focus Mode is active. Your LinkedIn feed is hidden.
          </p>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
            Inspirational quotes provided by{" "}
            <a
              href="https://zenquotes.io/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "white", textDecoration: "underline" }}>
              ZenQuotes API
            </a>
          </p>
        </div>

        <button
          onClick={fetchQuote}
          style={{
            padding: "12px 28px",
            background: "rgba(255, 255, 255, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: 8,
            color: "white",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
          }}>
          Get New Quote
        </button>
      </div>
    </div>
  )
}

export default LinkedInFocus

