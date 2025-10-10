import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { useEffect } from "react"

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"],
  all_frames: false
}

const storage = new Storage()

interface Quote {
  q: string
  a: string
}

const LinkedInFocus = () => {
  // Hide/show the main feed and add placeholder div with quotes
  useEffect(() => {
    const PLACEHOLDER_ID = "in-toolkit-placeholder"

    const fetchQuote = (): Promise<Quote> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: "FETCH_QUOTE" },
          (response: { success: boolean; quote?: Quote; error?: string }) => {
            if (response && response.success && response.quote) {
              resolve(response.quote)
            } else {
              // Fallback quote
              resolve({
                q: "The secret of getting ahead is getting started.",
                a: "Mark Twain"
              })
            }
          }
        )
      })
    }

    const createPlaceholder = async () => {
      const placeholder = document.createElement("div")
      placeholder.id = PLACEHOLDER_ID
      placeholder.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, rgb(7, 68, 117) 0%, rgb(4, 47, 82) 100%);
        color: white;
        text-align: center;
        padding: 60px 40px;
      `

      // Fetch and display quote
      const quote = await fetchQuote()
      
      placeholder.innerHTML = `
        <div style="max-width: 700px;">
          <div style="font-size: 48px; margin-bottom: 32px; opacity: 0.9;">🎯</div>
          <blockquote style="font-size: 32px; line-height: 1.5; font-weight: 300; margin: 0 0 24px 0; font-style: italic; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            "${quote.q}"
          </blockquote>
          <footer style="font-size: 20px; font-weight: 500; opacity: 0.9; margin-bottom: 50px;">
            — ${quote.a}
          </footer>
          <div style="padding: 20px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; font-size: 14px; border: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; opacity: 0.9;">Focus Mode is active. Your LinkedIn feed is hidden.</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
              Inspirational quotes provided by <a href="https://zenquotes.io/" target="_blank" style="color: white; text-decoration: underline;">ZenQuotes API</a>
            </p>
          </div>
          <button id="get-new-quote" style="padding: 12px 28px; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; color: white; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(10px);">
            Get New Quote
          </button>
        </div>
      `

      // Add click handler for the button
      setTimeout(() => {
        const button = placeholder.querySelector("#get-new-quote")
        if (button) {
          button.addEventListener("click", async () => {
            const newQuote = await fetchQuote()
            const blockquote = placeholder.querySelector("blockquote")
            const footer = placeholder.querySelector("footer")
            if (blockquote) blockquote.textContent = `"${newQuote.q}"`
            if (footer) footer.textContent = `— ${newQuote.a}`
          })
          
          button.addEventListener("mouseenter", (e) => {
            (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.3)"
          })
          
          button.addEventListener("mouseleave", (e) => {
            (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.2)"
          })
        }
      }, 0)

      return placeholder
    }

    const applyFocusMode = async () => {
      const enabled = await storage.get<boolean>("focusModeEnabled")
      const mainElement = document.querySelector("main") as HTMLElement
      
      if (mainElement) {
        if (enabled) {
          // Hide the feed
          mainElement.style.display = "none"
          
          // Create and insert placeholder div if it doesn't exist
          if (!document.getElementById(PLACEHOLDER_ID)) {
            const placeholder = await createPlaceholder()
            mainElement.parentElement?.insertBefore(placeholder, mainElement.nextSibling)
          }
        } else {
          // Show the feed
          mainElement.style.display = ""
          
          // Remove placeholder div
          const placeholder = document.getElementById(PLACEHOLDER_ID)
          if (placeholder) {
            placeholder.remove()
          }
        }
      }
    }

    // Apply on mount
    applyFocusMode()

    // Listen for messages from the popup
    const messageListener = async (
      message: { type: string; enabled: boolean }
    ) => {
      if (message.type === "FOCUS_MODE_CHANGED") {
        const mainElement = document.querySelector("main") as HTMLElement
        const placeholder = document.getElementById(PLACEHOLDER_ID)
        
        if (mainElement) {
          if (message.enabled) {
            // Hide the feed
            mainElement.style.display = "none"
            
            // Create and insert placeholder div if it doesn't exist
            if (!placeholder) {
              const newPlaceholder = await createPlaceholder()
              mainElement.parentElement?.insertBefore(newPlaceholder, mainElement.nextSibling)
            }
          } else {
            // Show the feed
            mainElement.style.display = ""
            
            // Remove placeholder div
            if (placeholder) {
              placeholder.remove()
            }
          }
        }
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  // This component doesn't render anything, it only manipulates the DOM
  return null
}

export default LinkedInFocus

