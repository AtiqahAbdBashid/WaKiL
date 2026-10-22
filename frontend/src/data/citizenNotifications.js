const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

function notificationFor(complaint, event, index) {
  const submitted = event.status === 'Pending' && index === 0
  const resolved = event.status === 'Resolved'
  const statusName = event.status === 'In Progress' ? 'In progress' : event.status

  return {
    id: `${complaint.id}-${event.status}-${event.at || index}`,
    complaintId: complaint.id,
    ticket: complaint.id.replaceAll('-', '').slice(0, 8).toUpperCase(),
    title: complaint.title,
    category: complaint.category,
    status: event.status,
    kind: submitted ? 'Submitted' : resolved ? 'Resolved' : 'Status changed',
    heading: submitted ? 'Complaint submitted' : resolved ? 'Complaint resolved' : 'Complaint status changed',
    message: submitted
      ? 'Your complaint was submitted and is awaiting review.'
      : resolved
        ? 'Your complaint has been resolved.'
        : `Your complaint status is now ${statusName}.`,
    at: event.at || complaint.created_at,
  }
}

function timestampOf(notification) {
  const timestamp = Date.parse(notification.at || '')
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function buildCitizenNotifications(complaints = []) {
  return complaints
    .flatMap((complaint) => (complaint.timeline || []).map((event, index) => notificationFor(complaint, event, index)))
    .sort((a, b) => timestampOf(b) - timestampOf(a))
}

export function countRecentUnread(notifications, readIds, now = Date.now()) {
  return notifications.filter((notification) => {
    const createdAt = Date.parse(notification.at || '')
    return Number.isFinite(createdAt)
      && now - createdAt <= RECENT_WINDOW_MS
      && !readIds.has(notification.id)
  }).length
}
