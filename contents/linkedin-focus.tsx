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
        background: white;
        border: 0.5px solid lightgray;
        border-radius: 10px;
        color: #495057;
        text-align: center;
        padding: 60px 40px;
      `

      // Fetch and display quote
      const quote = await fetchQuote()
      
      placeholder.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; max-width: 700px; margin: 0 auto;">
          <div style="font-size: 48px; margin-bottom: 10px; opacity: 0.7;">⚡</div>
          <blockquote style="font-size: 32px; line-height: 1.5; font-weight: 300; margin: 0 0 10px 0; font-style: italic; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); color: #212529; text-align: center;">
            "${quote.q}"
          </blockquote>
          <footer style="font-size: 20px; font-weight: 500; opacity: 0.8; color: #6c757d; text-align: center; margin-bottom: 10px;">
            ${quote.a}
          </footer>
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 12px; color: #6c757d;">
              Quotes by <a href="https://zenquotes.io/" target="_blank" style="color: #6c757d; text-decoration: underline;">ZenQuotes</a>
            </span>
          </div>
        </div>
      `

      // Add click handler for the link
      setTimeout(() => {
        const link = placeholder.querySelector("#get-new-quote")
        if (link) {
          link.addEventListener("click", async (e) => {
            e.preventDefault()
            const newQuote = await fetchQuote()
            const blockquote = placeholder.querySelector("blockquote")
            const footer = placeholder.querySelector("footer")
            if (blockquote) blockquote.textContent = `"${newQuote.q}"`
            if (footer) footer.textContent = `— ${newQuote.a}`
          })
          
          link.addEventListener("mouseenter", (e) => {
            (e.target as HTMLElement).style.color = "#007bff"
          })
          
          link.addEventListener("mouseleave", (e) => {
            (e.target as HTMLElement).style.color = "#6c757d"
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

