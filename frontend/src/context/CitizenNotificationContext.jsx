/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { buildCitizenNotifications, countRecentUnread } from '../data/citizenNotifications'
import { fetchMyComplaints } from '../services/chatApi'

const STORAGE_KEY = 'wakil-citizen-read-notifications'
const CitizenNotificationContext = createContext(null)

function readStoredIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function CitizenNotificationProvider({ children }) {
  const [complaints, setComplaints] = useState([])
  const [readIds, setReadIds] = useState(readStoredIds)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const result = await fetchMyComplaints()
      setComplaints(result)
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to load complaint notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    const load = async () => {
      try {
        const result = await fetchMyComplaints()
        if (isCurrent) {
          setComplaints(result)
          setError('')
        }
      } catch (err) {
        if (isCurrent) setError(err.message || 'Unable to load complaint notifications.')
      } finally {
        if (isCurrent) setLoading(false)
      }
    }
    load()
    const timer = window.setInterval(() => refresh(), 60_000)
    return () => {
      isCurrent = false
      window.clearInterval(timer)
    }
  }, [refresh])

  const notifications = useMemo(() => buildCitizenNotifications(complaints), [complaints])
  const unreadCount = useMemo(
    () => countRecentUnread(notifications, readIds),
    [notifications, readIds],
  )

  const markAllRead = useCallback(() => {
    const nextReadIds = new Set([...readIds, ...notifications.map((item) => item.id)])
    setReadIds(nextReadIds)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...nextReadIds]))
    } catch {
      // The visible feed still works when browser storage is unavailable.
    }
  }, [notifications, readIds])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAllRead,
  }), [notifications, unreadCount, loading, error, refresh, markAllRead])

  return (
    <CitizenNotificationContext.Provider value={value}>
      {children}
    </CitizenNotificationContext.Provider>
  )
}

export function useCitizenNotifications() {
  const context = useContext(CitizenNotificationContext)
  if (!context) throw new Error('useCitizenNotifications must be used within CitizenNotificationProvider')
  return context
}
