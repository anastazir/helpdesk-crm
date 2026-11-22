import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  aiChatOpen: boolean
}

const initialState: UIState = {
  sidebarOpen: false,
  sidebarCollapsed: false,
  aiChatOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setAiChatOpen: (state, action: PayloadAction<boolean>) => {
      state.aiChatOpen = action.payload
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setAiChatOpen,
} = uiSlice.actions
export default uiSlice.reducer
