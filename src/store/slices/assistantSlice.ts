import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface AssistantState {
  aiEnabled: boolean
  loaded: boolean
  canManage: boolean
}

const initialState: AssistantState = {
  aiEnabled: true,
  loaded: false,
  canManage: false,
}

const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    setAssistantSettings: (
      state,
      action: PayloadAction<{
        aiEnabled: boolean
        loaded: boolean
        canManage?: boolean
      }>,
    ) => {
      state.aiEnabled = action.payload.aiEnabled
      state.loaded = action.payload.loaded
      if (action.payload.canManage !== undefined) {
        state.canManage = action.payload.canManage
      }
    },
  },
})

export const { setAssistantSettings } = assistantSlice.actions
export default assistantSlice.reducer
