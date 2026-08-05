import { create } from "zustand"

interface EmailStats {
  unreadCount: number
  messageCount: number
}

interface EmailStatsStore {
  stats: Record<string, EmailStats>
  setStats: (entries: Array<{ id: string } & EmailStats>) => void
  adjustStats: (emailId: string, updates: {
    unreadDelta?: number
    messageDelta?: number
  }) => void
  removeStats: (emailId: string) => void
}

export const useEmailStats = create<EmailStatsStore>((set) => ({
  stats: {},
  setStats: (entries) => set((state) => ({
    stats: entries.reduce<Record<string, EmailStats>>((stats, entry) => {
      stats[entry.id] = {
        unreadCount: entry.unreadCount,
        messageCount: entry.messageCount,
      }
      return stats
    }, { ...state.stats }),
  })),
  adjustStats: (emailId, updates) => set((state) => {
    const current = state.stats[emailId] ?? { unreadCount: 0, messageCount: 0 }
    return {
      stats: {
        ...state.stats,
        [emailId]: {
          unreadCount: Math.max(0, current.unreadCount + (updates.unreadDelta ?? 0)),
          messageCount: Math.max(0, current.messageCount + (updates.messageDelta ?? 0)),
        },
      },
    }
  }),
  removeStats: (emailId) => set((state) => {
    const stats = { ...state.stats }
    delete stats[emailId]
    return { stats }
  }),
}))
