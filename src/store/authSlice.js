import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login as loginApi } from '../api/auth.api';

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const isTokenValid = (token) => {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true; // Non-JWT or no exp -> treat as valid
  return Date.now() < payload.exp * 1000;
};

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
const tokenValid = isTokenValid(storedToken);

if (!tokenValid) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await loginApi(credentials);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return { user: response.data.user, token: response.data.token };
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

const initialState = {
  user: tokenValid ? (JSON.parse(storedUser) || null) : null,
  token: tokenValid ? storedToken : null,
  isAuthenticated: tokenValid,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
