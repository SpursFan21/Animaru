//Animaru\src\redux\authSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  user: any | null
}

const initialState: AuthState = {
  user: null,
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload
    },
    clearUser: (state) => {
      state.user = null
    },
  },
})

export const { setUser, clearUser } = authSlice.actions
export default authSlice.reducer
