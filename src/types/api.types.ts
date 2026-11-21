export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T | null
  errors: Record<string, string[]> | string | null
}

export interface PaginatedData<T> {
  results: T[]
  count: number
  page: number
  page_size: number
  total_pages: number
}

export interface PaginationParams {
  page?: number
  page_size?: number
}
