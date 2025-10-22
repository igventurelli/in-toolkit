import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"],
  all_frames: false
}

const storage = new Storage()

interface MessageTemplate {
  id: string
  name: string
  content: string
  isDefault: boolean
  createdAt: number
}

const TemplateButton = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactFullName, setContactFullName] = useState("")

  useEffect(() => {
    loadTemplates()
    extractContactInfo()
    
    // Re-extract contact info when the page changes
    const intervalId = setInterval(() => {
      extractContactInfo()
    }, 1000)
    
    return () => clearInterval(intervalId)
  }, [])

  const loadTemplates = async () => {
    try {
      const storedTemplates = await storage.get<MessageTemplate[]>("messageTemplates")
      setTemplates(storedTemplates || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const extractContactInfo = () => {
    // Try to extract contact name from the current conversation/message thread
    const nameSelectors = [
      // Message thread header
      '.msg-s-message-list__name',
      '.msg-s-message-list__name a',
      '.msg-s-message-list__name .msg-s-message-list__name-link',
      '.msg-s-message-list__name .msg-s-message-list__name-link span',
      // Conversation header
      '.msg-conversation-listitem__participant-names',
      '.msg-conversation-listitem__participant-names a',
      // Profile name in conversation
      'h1[data-anonymize="person-name"]',
      // Alternative selectors for active conversation
      '.msg-s-message-list__name-link',
      '.msg-s-message-list__name-link span',
      // Message thread title
      '.msg-s-message-list__name .msg-s-message-list__name-link'
    ]

    // First, try to find the active conversation name
    const activeConversationSelectors = [
      '.msg-s-message-list__name',
      '.msg-s-message-list__name a',
      '.msg-s-message-list__name .msg-s-message-list__name-link'
    ]

    for (const selector of activeConversationSelectors) {
      const nameElement = document.querySelector(selector)
      if (nameElement) {
        const fullName = nameElement.textContent?.trim() || ""
        if (fullName && fullName !== "LinkedIn" && fullName.length > 1) {
          setContactFullName(fullName)
          // Extract first name (everything before the first space)
          const firstName = fullName.split(' ')[0]
          setContactName(firstName)
          console.log('Extracted contact info:', { firstName, fullName })
          return
        }
      }
    }

    // Fallback: try other selectors
    for (const selector of nameSelectors) {
      const nameElement = document.querySelector(selector)
      if (nameElement) {
        const fullName = nameElement.textContent?.trim() || ""
        if (fullName && fullName !== "LinkedIn" && fullName.length > 1) {
          setContactFullName(fullName)
          // Extract first name (everything before the first space)
          const firstName = fullName.split(' ')[0]
          setContactName(firstName)
          console.log('Extracted contact info (fallback):', { firstName, fullName })
          break
        }
      }
    }
  }

  const replaceVariables = (template: string): string => {
    return template
      .replace(/\{name\}/g, contactName)
      .replace(/\{fullName\}/g, contactFullName)
  }

  const insertTemplate = (template: MessageTemplate) => {
    const processedContent = replaceVariables(template.content)
    console.log('Attempting to insert template:', processedContent)
    
    // Try multiple selectors for LinkedIn message input
    const messageInputSelectors = [
      'div[contenteditable="true"][data-artdeco-is-focused="true"]',
      'div[contenteditable="true"]',
      '.msg-form__contenteditable',
      '.msg-form__contenteditable-container div[contenteditable="true"]',
      '[data-artdeco-is-focused="true"]',
      '.msg-form__contenteditable-container',
      '.msg-form__contenteditable-wrapper div[contenteditable="true"]'
    ]

    let messageInput: HTMLElement | null = null
    
    for (const selector of messageInputSelectors) {
      const elements = document.querySelectorAll(selector)
      console.log(`Checking selector "${selector}": found ${elements.length} elements`)
      
      for (const element of elements) {
        const htmlElement = element as HTMLElement
        if (htmlElement.isContentEditable) {
          messageInput = htmlElement
          console.log('Found contenteditable element:', htmlElement)
          break
        }
      }
      if (messageInput) break
    }

    if (messageInput) {
      console.log('Inserting into element:', messageInput)
      
      try {
        // Clear existing content completely
        messageInput.innerHTML = ""
        
        // Insert the template content
        messageInput.textContent = processedContent
        
        // Trigger input event first
        const inputEvent = new Event('input', { bubbles: true, cancelable: true })
        messageInput.dispatchEvent(inputEvent)
        
        // Trigger other events to ensure LinkedIn detects the change
        const events = ['keyup', 'change', 'blur', 'focus', 'paste']
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true })
          messageInput!.dispatchEvent(event)
        })
        
        // Also try setting the value property if it exists
        if ('value' in messageInput) {
          (messageInput as any).value = processedContent
        }
        
        // Focus the input
        messageInput.focus()
        
        // Force a re-render by briefly changing and restoring content
        setTimeout(() => {
          const currentContent = messageInput!.textContent
          messageInput!.textContent = ""
          messageInput!.textContent = currentContent
          
          // Trigger final input event
          const finalInputEvent = new Event('input', { bubbles: true, cancelable: true })
          messageInput!.dispatchEvent(finalInputEvent)
        }, 50)
        
        console.log('Template inserted successfully:', processedContent)
      } catch (error) {
        console.error('Error inserting template:', error)
      }
    } else {
      console.log('Message input not found - trying alternative approach')
      
      // Alternative approach: try to find any contenteditable div
      const allContentEditable = document.querySelectorAll('div[contenteditable="true"]')
      console.log('Found contenteditable elements:', allContentEditable.length)
      
      if (allContentEditable.length > 0) {
        const lastInput = allContentEditable[allContentEditable.length - 1] as HTMLElement
        console.log('Using last contenteditable element:', lastInput)
        
        lastInput.innerHTML = processedContent
        lastInput.focus()
        
        // Trigger events
        const events = ['input', 'keyup', 'change']
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true })
          lastInput.dispatchEvent(event)
        })
      }
    }
    
    setShowDropdown(false)
  }

  const handleDefaultTemplate = () => {
    const defaultTemplate = templates.find(t => t.isDefault)
    if (defaultTemplate) {
      insertTemplate(defaultTemplate)
    }
  }

  const handleTemplateSelect = (template: MessageTemplate) => {
    insertTemplate(template)
  }

  if (templates.length === 0) {
    return null
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={handleDefaultTemplate}
        onMouseEnter={() => setShowDropdown(true)}
        style={{
          background: "#084475",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "6px 12px",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "background-color 0.2s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#0056b3"}
        onMouseLeave={(e) => e.currentTarget.style.background = "#084475"}
      >
        📝 Template
        <span style={{ fontSize: "10px" }}>▼</span>
      </button>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            right: "0",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 1000,
            minWidth: "200px",
            maxHeight: "300px",
            overflow: "auto"
          }}
          onMouseLeave={() => setShowDropdown(false)}
        >
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: "1px solid #f3f4f6",
                transition: "background-color 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              <div style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#1a1a1a",
                marginBottom: "4px"
              }}>
                {template.name}
                {template.isDefault && (
                  <span style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "#084475",
                    color: "white",
                    marginLeft: "8px"
                  }}>
                    Default
                  </span>
                )}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#6b7280",
                lineHeight: "1.4",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {template.content.length > 50 
                  ? `${template.content.substring(0, 50)}...` 
                  : template.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const LinkedInDM = () => {
  useEffect(() => {
    const addTemplateButton = () => {
      // Look for message input areas with multiple selectors
      const messageInputSelectors = [
        'div[contenteditable="true"]',
        '.msg-form__contenteditable',
        '.msg-form__contenteditable-container',
        '[data-artdeco-is-focused="true"]'
      ]

      let messageInput: Element | null = null
      
      for (const selector of messageInputSelectors) {
        messageInput = document.querySelector(selector)
        if (messageInput) {
          break
        }
      }

      if (messageInput) {
        // Check if template button already exists in the entire document
        const existingButton = document.querySelector('.in-toolkit-template-button')
        if (existingButton) {
          return
        }

        // Create container for template button
        const buttonContainer = document.createElement('div')
        buttonContainer.className = 'in-toolkit-template-button'
        buttonContainer.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 1000;
        `

        // Insert the React component
        const root = createRoot(buttonContainer)
        root.render(<TemplateButton />)

        // Add to the input container
        const inputContainer = messageInput.closest('.msg-form__contenteditable-container, .msg-form__contenteditable, .msg-form__contenteditable-wrapper, .msg-form__contenteditable-container')
        if (inputContainer) {
          (inputContainer as HTMLElement).style.position = 'relative'
          inputContainer.appendChild(buttonContainer)
        } else {
          // Fallback: add to the message input itself
          (messageInput as HTMLElement).style.position = 'relative'
          messageInput.appendChild(buttonContainer)
        }
      }
    }

    // Initial check
    addTemplateButton()

    // Watch for new message inputs with a more targeted approach
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.querySelector && (
                element.querySelector('div[contenteditable="true"]') ||
                element.classList.contains('msg-form__contenteditable') ||
                element.classList.contains('msg-form__contenteditable-container')
              )) {
                shouldCheck = true
              }
            }
          })
        }
      })
      
      if (shouldCheck) {
        setTimeout(addTemplateButton, 100)
      }
    })

    // Also check periodically to ensure button stays
    const intervalId = setInterval(() => {
      const existingButton = document.querySelector('.in-toolkit-template-button')
      if (!existingButton) {
        addTemplateButton()
      }
    }, 2000)

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
      clearInterval(intervalId)
    }
  }, [])

  return null
}

export default LinkedInDM
