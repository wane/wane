export interface TodoItem {
  id: number
  text: string
  isCompleted: boolean
}

export type Filter = 'all' | 'complete' | 'incomplete'
