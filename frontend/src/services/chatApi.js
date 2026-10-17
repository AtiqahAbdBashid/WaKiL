const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Send a chat message to WaKiL AI.
 * @param {string} message - The message text sent by citizen.
 * @param {string|null} sessionId - Optional UUID of current chat session.
 * @param {string|null} image - Optional base64 image data URI.
 * @returns {Promise<{ reply: string, session_id: string, can_confirm: boolean }>}
 */
export async function sendChatMessage(message, sessionId = null, image = null) {
  const payload = {
    message,
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(image ? { image } : {}),
  }

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let errorDetail = 'Failed to get response from WaKiL AI.'
    try {
      const errJson = await res.json()
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // Non-JSON error body: keep the default message.
    }
    throw new Error(errorDetail)
  }

  return res.json()
}

/**
 * Confirm and finalize complaint intake into an official ticket.
 * @param {string} sessionId - The UUID of the current chat session.
 * @param {string|null} location - Optional location string with coordinates.
 * @param {string|null} image - Optional base64 image data URI.
 * @returns {Promise<{ ticket_id: string, status: string, parliament?: string, dun?: string, image_url?: string }>}
 */
export async function confirmComplaint(sessionId, location = null, image = null) {
  if (!sessionId) {
    throw new Error('A valid chat session ID is required to confirm complaint.')
  }

  const payload = {
    session_id: sessionId,
    ...(location ? { location } : {}),
    ...(image ? { image } : {}),
  }

  const res = await fetch(`${API_BASE}/chat/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let errorDetail = 'Failed to confirm complaint.'
    try {
      const errJson = await res.json()
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail)
  }

  return res.json()
}

/**
 * Request Gemini AI to suggest a category, priority, and summary for a complaint description and/or image.
 * @param {{ summary?: string, location?: string, when?: string, image?: string }} params
 * @returns {Promise<{ category: string, priority: string, confidence: number, summary: string }>}
 */
export async function suggestCategory({ summary = '', location = '', when = '', image = null }) {
  if ((!summary || !summary.trim()) && !image) {
    throw new Error('Either summary or an image is required to suggest category.')
  }

  const res = await fetch(`${API_BASE}/complaints/suggest-category`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: summary ? summary.trim() : '',
      location,
      when,
      ...(image ? { image } : {}),
    }),
  })

  if (!res.ok) {
    let errorDetail = 'Failed to suggest category with AI.'
    try {
      const errJson = await res.json()
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  return res.json()
}

/**
 * Submit a complaint form directly with summary, location, when, and category.
 * @param {{ what_happened: string, location: string, when: string, category?: string, priority?: string }} data
 * @returns {Promise<{ ticket_id: string, status: string, category: string, priority: string, summary: string }>}
 */
export async function submitComplaintForm(data) {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    let errorDetail = 'Failed to submit complaint.'
    try {
      const errJson = await res.json()
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  return res.json()
}

/**
 * Fetch the list of official complaint categories from the backend.
 * @returns {Promise<string[]>}
 */
export async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/complaints/categories`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.categories)) {
        return data.categories
      }
    }
  } catch {
    // fallback below if offline
  }

  return [
    'Infrastructure/Roads',
    'Drainage & Flood',
    'Waste & Sanitation',
    'Public Safety',
    'Utilities',
    'Welfare & Aid',
    'Others',
  ]
}

/**
 * Fetch all chat sessions for the citizen.
 * @returns {Promise<Array<{ id: string, status: string, started_at: string, ended_at?: string, title: string, preview?: string, complaint_ticket_id?: string, message_count: number }>>}
 */
export async function fetchChatSessions() {
  const res = await fetch(`${API_BASE}/chat/sessions`)
  if (!res.ok) {
    throw new Error('Failed to load chat history.')
  }
  return res.json()
}

/**
 * Start a new chat session explicitly.
 * @returns {Promise<{ id: string, status: string, started_at: string, title: string }>}
 */
export async function startNewChatSession() {
  const res = await fetch(`${API_BASE}/chat/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    throw new Error('Failed to start a new chat session.')
  }
  return res.json()
}

/**
 * Fetch full messages and details of a specific chat session.
 * @param {string} sessionId
 * @returns {Promise<{ id: string, status: string, messages: Array<any>, can_confirm: boolean, complaint_ticket_id?: string, parliament?: string, dun?: string }>}
 */
export async function fetchChatSessionDetail(sessionId) {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`)
  if (!res.ok) {
    throw new Error('Failed to load conversation details.')
  }
  return res.json()
}

/**
 * Delete a specific chat session.
 * @param {string} sessionId
 */
export async function deleteChatSession(sessionId) {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error('Failed to delete conversation.')
  }
  return res.json()
}



