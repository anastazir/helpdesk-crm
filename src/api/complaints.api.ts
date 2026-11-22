import api from '@/api/axios'
import type { ApiResponse, PaginatedData, PaginationParams } from '@/types/api.types'
import type {
  AssignPayload,
  Complaint,
  ComplaintAssignmentRecord,
  ComplaintLimited,
  ComplaintListParams,
  ComplaintListItem,
  CreateComplaintPayload,
  JobNote,
  JobNotePayload,
  ReopenPayload,
  StatusHistory,
  StatusUpdatePayload,
  UpdateComplaintPayload,
} from '@/types/complaint.types'
import { logger } from '@/utils/logger'

export const complaintsApi = {
  list: async (
    params?: ComplaintListParams,
  ): Promise<ApiResponse<PaginatedData<ComplaintListItem>>> => {
    logger.api('GET', '/complaints/', params)
    const res = await api.get<ApiResponse<PaginatedData<ComplaintListItem>>>('/complaints/', {
      params,
    })
    return res.data
  },

  listLimited: async (
    params?: ComplaintListParams,
  ): Promise<ApiResponse<PaginatedData<ComplaintLimited>>> => {
    logger.api('GET', '/complaints/', params)
    const res = await api.get<ApiResponse<PaginatedData<ComplaintLimited>>>('/complaints/', {
      params,
    })
    return res.data
  },

  myComplaints: async (
    params?: ComplaintListParams & PaginationParams,
  ): Promise<ApiResponse<PaginatedData<Complaint>>> => {
    logger.api('GET', '/complaints/my/', params)
    const res = await api.get<ApiResponse<PaginatedData<Complaint>>>('/complaints/my/', {
      params,
    })
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<Complaint>> => {
    logger.api('GET', `/complaints/${id}/`)
    const res = await api.get<ApiResponse<Complaint>>(`/complaints/${id}/`)
    return res.data
  },

  create: async (data: CreateComplaintPayload): Promise<ApiResponse<Complaint>> => {
    logger.api('POST', '/complaints/', data)
    const res = await api.post<ApiResponse<Complaint>>('/complaints/', data)
    return res.data
  },

  update: async (
    id: number,
    data: Partial<UpdateComplaintPayload>,
  ): Promise<ApiResponse<Complaint>> => {
    logger.api('PATCH', `/complaints/${id}/`, data)
    const res = await api.patch<ApiResponse<Complaint>>(`/complaints/${id}/`, data)
    return res.data
  },

  assign: async (id: number, data: AssignPayload): Promise<ApiResponse<Complaint>> => {
    logger.api('POST', `/complaints/${id}/assign/`, data)
    const res = await api.post<ApiResponse<Complaint>>(`/complaints/${id}/assign/`, data)
    return res.data
  },

  updateStatus: async (
    id: number,
    data: StatusUpdatePayload,
  ): Promise<ApiResponse<Complaint>> => {
    logger.api('POST', `/complaints/${id}/status/`, data)
    const res = await api.post<ApiResponse<Complaint>>(`/complaints/${id}/status/`, data)
    return res.data
  },

  submitJobNote: async (id: number, data: JobNotePayload): Promise<ApiResponse<JobNote>> => {
    logger.api('POST', `/complaints/${id}/job-note/`, data)
    const res = await api.post<ApiResponse<JobNote>>(`/complaints/${id}/job-note/`, data)
    return res.data
  },

  updateLocation: async (
    id: number,
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<Complaint>> => {
    logger.api('POST', `/complaints/${id}/location/`, { latitude, longitude })
    const res = await api.post<ApiResponse<Complaint>>(
      `/complaints/${id}/location/`,
      { latitude, longitude },
    )
    return res.data
  },

  geocode: async (id: number): Promise<ApiResponse<Complaint>> => {
    logger.api('POST', `/complaints/${id}/geocode/`)
    const res = await api.post<ApiResponse<Complaint>>(`/complaints/${id}/geocode/`)
    return res.data
  },

  reopen: async (id: number, data: ReopenPayload): Promise<ApiResponse<Complaint>> => {
    logger.api('POST', `/complaints/${id}/reopen/`, data)
    const res = await api.post<ApiResponse<Complaint>>(`/complaints/${id}/reopen/`, data)
    return res.data
  },

  getHistory: async (id: number): Promise<ApiResponse<StatusHistory[]>> => {
    logger.api('GET', `/complaints/${id}/history/`)
    const res = await api.get<ApiResponse<StatusHistory[]>>(`/complaints/${id}/history/`)
    return res.data
  },

  getAssignments: async (id: number): Promise<ApiResponse<ComplaintAssignmentRecord[]>> => {
    logger.api('GET', `/complaints/${id}/assignments/`)
    const res = await api.get<ApiResponse<ComplaintAssignmentRecord[]>>(
      `/complaints/${id}/assignments/`,
    )
    return res.data
  },
}
