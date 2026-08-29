export interface ExpiryOption {
  label: string
  value: number
}

export interface MailboxListItem {
  id: string
  address: string
  createdAt: number
  expiresAt: number
  isCatchAll?: boolean
  isCatchAllEnabled?: boolean
  unreadCount: number
  messageCount: number
}

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1小时', value: 1000 * 60 * 60 },
  { label: '24小时', value: 1000 * 60 * 60 * 24 },
  { label: '3天', value: 1000 * 60 * 60 * 24 * 3 },
  { label: '永久', value: 0 }
]
