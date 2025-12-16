"use client"

import { useEffect, useState } from "react"

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState<any[]>([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const syncPendingData = async () => {
    console.log("[v0] Syncing pending data...")
    setPendingSync([])
    localStorage.setItem("isOnline", "true")
  }

  const addPendingSync = (data: any) => {
    setPendingSync((prev) => [...prev, data])
    if (!isOnline) {
      localStorage.setItem("pendingSync", JSON.stringify(pendingSync))
    }
  }

  return { isOnline, pendingSync, addPendingSync }
}
