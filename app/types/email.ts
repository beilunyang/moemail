export interface ExpiryOption {
  label: string
  value: number
}

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1小時', value: 1000 * 60 * 60 },
  { label: '24小時', value: 1000 * 60 * 60 * 24 },
  { label: '3天', value: 1000 * 60 * 60 * 24 * 3 },
  { label: '永久', value: 0 }
]
