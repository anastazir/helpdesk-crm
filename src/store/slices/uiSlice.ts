import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
}

const initialState: UIState = {
  sidebarOpen: false,
  sidebarCollapsed: false,
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
  },
})

export const { toggleSidebar, setSidebarOpen, toggleSidebarCollapsed } =
  uiSlice.actions
export default uiSlice.reducer
