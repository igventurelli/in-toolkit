import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { useEffect } from "react"

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"],
  all_frames: false
}

const storage = new Storage()

const LinkedInFocus = () => {
  // Hide/show the main feed and add placeholder div
  useEffect(() => {
    const PLACEHOLDER_ID = "in-toolkit-placeholder"

    const applyFocusMode = async () => {
      const enabled = await storage.get<boolean>("focusModeEnabled")
      const mainElement = document.querySelector("main") as HTMLElement
      
      if (mainElement) {
        if (enabled) {
          // Hide the feed
          mainElement.style.display = "none"
          
          // Create and insert placeholder div if it doesn't exist
          if (!document.getElementById(PLACEHOLDER_ID)) {
            const placeholder = document.createElement("div")
            placeholder.id = PLACEHOLDER_ID
            placeholder.style.cssText = `
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-size: 32px;
              font-weight: 300;
              text-align: center;
              padding: 40px;
            `
            placeholder.textContent = "Focus Mode Active"
            
            // Insert after the main element
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
    const messageListener = (
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
              const newPlaceholder = document.createElement("div")
              newPlaceholder.id = PLACEHOLDER_ID
              newPlaceholder.style.cssText = `
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 32px;
                font-weight: 300;
                text-align: center;
                padding: 40px;
              `
              newPlaceholder.textContent = "Focus Mode Active"
              
              // Insert after the main element
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

