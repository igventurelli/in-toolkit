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

    const isFeedPage = () => {
      const url = new URL(window.location.href)
      return url.pathname.startsWith('/feed')
    }

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
        padding: 20px;
      `

      placeholder.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 200px; gap: 20px;">
          <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #94a8bd; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <div style="text-align: center;">
            <h1 style="margin: 0; font-size: 18px; color: #333;">Loading quote...</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Please wait while we fetch your inspiration</p>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `

      // Fetch and display quote
      const quote = fetchQuote().then((quote) => {
        placeholder.innerHTML = `
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img
                src="${iconUrl}"
                alt="In Toolkit"
                style="width: 40px; height: 40px; border-radius: 10px;"
              />
              <div>
                <h1 style="text-align: left; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.3px; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  In Toolkit
                </h1>
                <p style="margin: 2px 0 0 0; font-size: 13px; color: #6b7280; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  LinkedIn productivity tools
                </p>
              </div>
            </div>
            <div style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgb(7, 68, 117); color: white; font-weight: 500;">
              Focus Mode Active
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; max-width: 700px; margin: 0 auto; padding: 0 24px;">
            <div style="font-size: 48px; margin-bottom: 10px; opacity: 0.7;">⚡</div>
            <blockquote style="font-size: 32px; line-height: 1.5; font-weight: 300; margin: 0 0 10px 0; font-style: italic; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); color: #212529; text-align: center;">
              "${quote.q}"
            </blockquote>
            <footer style="font-size: 20px; font-weight: 500; opacity: 0.8; color: #6c757d; text-align: center; margin-bottom: 10px;">
              ${quote.a}
            </footer>
            <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px;">
              <span style="font-size: 12px; color: #6c757d;">
                Quotes by <a href="https://zenquotes.io/" target="_blank" style="color: #6c757d; text-decoration: underline;">ZenQuotes</a>
              </span>
            </div>
          </div>

          <!-- Buy Me A Coffee -->
          <div style="display: flex; justify-content: end; width: 100%;">
            <a href="https://www.buymeacoffee.com/igventurelli" target="_blank" style="opacity: 0.7; transition: opacity 0.2s ease; height: 40px;">
              <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px;" >
            </a>
          </div>
      `
      }).catch((error) => {
        console.error("Error fetching quote:", error)
        placeholder.innerHTML = `<h1>Error fetching quote</h1><p>${error.message}</p>`
      })
      
      // Get the extension icon URL by messaging the background script
      const iconUrl = await new Promise<string>((resolve) => {
        chrome.runtime.sendMessage(
          { type: "GET_ICON_URL" },
          (response: { iconUrl?: string }) => {
            resolve(response?.iconUrl || "/icon.png")
          }
        )
      })

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
      
      // Only apply focus mode if we're on the /feed page
      if (!isFeedPage()) {
        // If not on feed page, ensure any existing placeholder is removed
        const placeholder = document.getElementById(PLACEHOLDER_ID)
        if (placeholder) {
          placeholder.remove()
        }
        // Ensure main element is visible
        if (mainElement) {
          mainElement.style.display = ""
        }
        return
      }
      
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

    // Track URL changes with multiple detection methods
    let currentUrl = window.location.href
    let lastPathname = window.location.pathname

    const handleUrlChange = () => {
      const newUrl = window.location.href
      const newPathname = window.location.pathname
      
      if (newUrl !== currentUrl || newPathname !== lastPathname) {
        console.log('URL change detected:', { 
          oldUrl: currentUrl, 
          newUrl, 
          oldPath: lastPathname, 
          newPath: newPathname,
          isFeedPage: isFeedPage()
        })
        
        currentUrl = newUrl
        lastPathname = newPathname
        
        if (isFeedPage()) {
          console.log('Re-applying focus mode on feed page')
          applyFocusMode()
        }
      }
    }

    // Method 1: History API overrides
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      console.log('pushState called', args)
      originalPushState.apply(history, args)
      setTimeout(handleUrlChange, 100)
    }

    history.replaceState = function(...args) {
      console.log('replaceState called', args)
      originalReplaceState.apply(history, args)
      setTimeout(handleUrlChange, 100)
    }

    // Method 2: Popstate events
    window.addEventListener('popstate', () => {
      console.log('popstate event')
      setTimeout(handleUrlChange, 100)
    })

    // Method 3: Periodic URL checking (fallback)
    const urlCheckInterval = setInterval(() => {
      handleUrlChange()
    }, 1000)

    // Method 4: Mutation observer for DOM changes
    const observer = new MutationObserver((mutations) => {
      // Check if main content area changed
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.tagName === 'MAIN' || element.querySelector('main')) {
                console.log('Main element detected via mutation observer')
                setTimeout(handleUrlChange, 200)
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Listen for messages from the popup
    const messageListener = async (
      message: { type: string; enabled: boolean }
    ) => {
      if (message.type === "FOCUS_MODE_CHANGED") {
        const mainElement = document.querySelector("main") as HTMLElement
        const placeholder = document.getElementById(PLACEHOLDER_ID)
        
        // Only apply focus mode if we're on the /feed page
        if (!isFeedPage()) {
          // If not on feed page, ensure any existing placeholder is removed
          if (placeholder) {
            placeholder.remove()
          }
          // Ensure main element is visible
          if (mainElement) {
            mainElement.style.display = ""
          }
          return
        }
        
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
      window.removeEventListener('popstate', handleUrlChange)
      clearInterval(urlCheckInterval)
      observer.disconnect()
      
      // Restore original history methods
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [])

  // This component doesn't render anything, it only manipulates the DOM
  return null
}

export default LinkedInFocus

