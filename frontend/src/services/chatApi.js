const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// JSON request helper. On failure it throws the backend's `detail` when present,
// otherwise `failureMessage`.
async function request(path, { method = 'GET', body, failureMessage }) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    ...(body !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  })

  if (!res.ok) {
    let message = failureMessage
    try {
      const { detail } = await res.json()
      if (detail) message = typeof detail === 'string' ? detail : JSON.stringify(detail)
    } catch {
      // Non-JSON error body: keep the fallback message.
    }
    throw new Error(message)
  }

  return res.json()
}

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

  return request('/chat', { method: 'POST', body: payload, failureMessage: 'Failed to get response from WaKiL AI.' })
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

  return request('/chat/confirm', { method: 'POST', body: payload, failureMessage: 'Failed to confirm complaint.' })
}

/**
 * Request Gemini AI to suggest primary/secondary categories, priority, and summary for a complaint description and/or image.
 * @param {{ summary?: string, location?: string, when?: string, image?: string }} params
 * @returns {Promise<{ category: string, secondary_categories: string[], priority: string, confidence: number, summary: string, summary_tip: string }>}
 */
export async function suggestCategory({ summary = '', location = '', when = '', image = null }) {
  if ((!summary || !summary.trim()) && !image) {
    throw new Error('Either summary or an image is required to suggest category.')
  }

  return request('/complaints/suggest-category', {
    method: 'POST',
    body: {
      summary: summary ? summary.trim() : '',
      location,
      when,
      ...(image ? { image } : {}),
    },
    failureMessage: 'Failed to suggest category with AI.',
  })
}

/**
 * Submit a complaint form with the AI-selected category list.
 * @param {{ what_happened: string, location: string, when: string, category: string, categories: string[], priority?: string, photo_exception_reason?: string|null }} data
 * @returns {Promise<{ ticket_id: string, status: string, category: string, categories: string[], priority: string, summary: string, manual_review_required: boolean }>}
 */
export async function submitComplaintForm(data) {
  return request('/complaints', { method: 'POST', body: data, failureMessage: 'Failed to submit complaint.' })
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
    'Roads & Infrastructure',
    'Flooding & Drainage',
    'Welfare & Assistance',
    'Housing',
    'Employment & Economy',
    'Healthcare',
    'Education',
    'Public Safety',
    'Cleanliness & Environment',
    'Transportation',
    'Government Services',
    'Community Issues',
    'Other',
  ]
}

/** Fetch only the current citizen's complaints and public status timeline. */
export async function fetchMyComplaints() {
  const data = await request('/complaints/mine', {
    failureMessage: 'Unable to load your complaints right now.',
  })
  return Array.isArray(data.complaints) ? data.complaints : []
}

/** Delete one of the citizen's complaints while it is still Pending. */
export async function deleteMyComplaint(complaintId) {
  return request(`/complaints/${complaintId}`, {
    method: 'DELETE',
    failureMessage: 'Unable to delete this complaint.',
  })
}

/**
 * Fetch all chat sessions for the citizen.
 * @returns {Promise<Array<{ id: string, status: string, started_at: string, ended_at?: string, title: string, preview?: string, complaint_ticket_id?: string, message_count: number }>>}
 */
export async function fetchChatSessions() {
  return request('/chat/sessions', { failureMessage: 'Failed to load chat history.' })
}

/**
 * Start a new chat session explicitly.
 * @returns {Promise<{ id: string, status: string, started_at: string, title: string }>}
 */
export async function startNewChatSession() {
  return request('/chat/sessions', { method: 'POST', failureMessage: 'Failed to start a new chat session.' })
}

/**
 * Fetch full messages and details of a specific chat session.
 * @param {string} sessionId
 * @returns {Promise<{ id: string, status: string, messages: Array<any>, can_confirm: boolean, complaint_ticket_id?: string, parliament?: string, dun?: string }>}
 */
export async function fetchChatSessionDetail(sessionId) {
  return request(`/chat/sessions/${sessionId}`, { failureMessage: 'Failed to load conversation details.' })
}

/**
 * Delete a specific chat session.
 * @param {string} sessionId
 */
export async function deleteChatSession(sessionId) {
  return request(`/chat/sessions/${sessionId}`, { method: 'DELETE', failureMessage: 'Failed to delete conversation.' })
}
