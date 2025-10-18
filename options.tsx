import { Storage } from "@plasmohq/storage"
import { useEffect, useState } from "react"

import iconUrl from "data-base64:~assets/icon.png"

const storage = new Storage()

interface MessageTemplate {
  id: string
  name: string
  content: string
  isDefault: boolean
  createdAt: number
}

function OptionsIndex() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    content: ""
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const storedTemplates = await storage.get<MessageTemplate[]>("messageTemplates")
      setTemplates(storedTemplates || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTemplates = async (newTemplates: MessageTemplate[]) => {
    await storage.set("messageTemplates", newTemplates)
    setTemplates(newTemplates)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.content.trim()) {
      alert("Please fill in all fields")
      return
    }

    const newTemplate: MessageTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: formData.name.trim(),
      content: formData.content.trim(),
      isDefault: editingTemplate?.isDefault || templates.length === 0,
      createdAt: editingTemplate?.createdAt || Date.now()
    }

    let updatedTemplates: MessageTemplate[]
    
    if (editingTemplate) {
      // Update existing template
      updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id ? newTemplate : t
      )
    } else {
      // Add new template
      updatedTemplates = [...templates, newTemplate]
    }

    await saveTemplates(updatedTemplates)
    resetForm()
  }

  const resetForm = () => {
    setIsClosing(true)
    setTimeout(() => {
      setFormData({ name: "", content: "" })
      setEditingTemplate(null)
      setShowForm(false)
      setIsClosing(false)
    }, 200)
  }

  const handleEdit = (template: MessageTemplate) => {
    setFormData({
      name: template.name,
      content: template.content
    })
    setEditingTemplate(template)
    setShowForm(true)
  }

  const handleDelete = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      const updatedTemplates = templates.filter(t => t.id !== templateId)
      
      // If we deleted the default template, make the first remaining one default
      if (templates.find(t => t.id === templateId)?.isDefault && updatedTemplates.length > 0) {
        updatedTemplates[0].isDefault = true
      }
      
      await saveTemplates(updatedTemplates)
    }
  }

  const handleSetDefault = async (templateId: string) => {
    const updatedTemplates = templates.map(t => ({
      ...t,
      isDefault: t.id === templateId
    }))
    await saveTemplates(updatedTemplates)
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      
      textarea.value = before + `{${variable}}` + after
      textarea.selectionStart = textarea.selectionEnd = start + variable.length + 2
      textarea.focus()
      
      setFormData(prev => ({ ...prev, content: textarea.value }))
    }
  }

  if (isLoading) {
    return (
      <div style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div>Loading templates...</div>
      </div>
    )
  }

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: "#ffffff",
      color: "#1a1a1a"
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
          
          @keyframes slideOut {
            from {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
            to {
              opacity: 0;
              transform: scale(0.9) translateY(-20px);
            }
          }
        `}
      </style>
      {/* Header */}
      <div style={{
        padding: "24px",
        borderBottom: "1px solid #f0f0f0",
        background: "#fafafa"
      }}>
        <div style={{
          maxWidth: "800px",
          margin: "0 auto",
          width: "100%"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
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
                <h1 style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#1a1a1a"
                }}>
                  Message Templates
                </h1>
                <p style={{
                  margin: "4px 0 0 0",
                  fontSize: 14,
                  color: "#6b7280"
                }}>
                  Create and manage your LinkedIn message templates
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              style={{
                background: "#084475",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#0056b3"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#084475"}
            >
              + Add New Template
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px" }}>
        {templates.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#6b7280"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#333" }}>
              No templates yet
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px" }}>
              Create your first message template to get started
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                background: "#084475",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              Create Template
            </button>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gap: "16px",
            maxWidth: "800px",
            margin: "0 auto",
            width: "100%"
          }}>
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleEdit(template)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc"
                  e.currentTarget.style.borderColor = "#d1d5db"
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff"
                  e.currentTarget.style.borderColor = "#e5e7eb"
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1a1a1a"
                      }}>
                        {template.name}
                      </h3>
                      {template.isDefault && (
                        <span style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "#084475",
                          color: "white",
                          fontWeight: "500"
                        }}>
                          Default
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#6b7280",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap"
                    }}>
                      {template.content}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end"
                }}>
                  {!template.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetDefault(template.id)
                      }}
                      style={{
                        background: "transparent",
                        color: "#084475",
                        border: "1px solid #084475",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(template)
                    }}
                    style={{
                      background: "transparent",
                      color: "#000",
                      border: "1px solid black",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(template.id)
                    }}
                    style={{
                      background: "transparent",
                      color: "#dc2626",
                      border: "1px solid #dc2626",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            animation: isClosing ? "fadeOut 0.2s ease-in" : "fadeIn 0.2s ease-out"
          }}
        >
          <div 
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "auto",
              animation: isClosing ? "slideOut 0.2s ease-in" : "slideIn 0.3s ease-out",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            <h2 style={{
              margin: "0 0 20px 0",
              fontSize: "20px",
              fontWeight: "600"
            }}>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151"
                }}>
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Initial Connection"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151"
                }}>
                  Message Content
                </label>
                
                {/* Variable buttons */}
                <div style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  flexWrap: "wrap"
                }}>
                  <button
                    type="button"
                    onClick={() => insertVariable("name")}
                    style={{
                      background: "#f8f9fa",
                      color: "#e83e8c",
                      border: "1px solid #e9ecef",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    {"{name}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("fullName")}
                    style={{
                      background: "#f8f9fa",
                      color: "#e83e8c",
                      border: "1px solid #e9ecef",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    {"{fullName}"}
                  </button>
                </div>
                
                <textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Hi {name}, I hope this message finds you well..."
                  style={{
                    width: "100%",
                    height: "120px",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit"
                  }}
                  required
                />
                <p style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  color: "#6b7280"
                }}>
                  Use the buttons above to insert variables like {"{name}"} and {"{fullName}"}
                </p>
              </div>

              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end"
              }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: "transparent",
                    color: "#6b7280",
                    border: "0px solid #d1d5db",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#084475",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  {editingTemplate ? "Update Template" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default OptionsIndex
