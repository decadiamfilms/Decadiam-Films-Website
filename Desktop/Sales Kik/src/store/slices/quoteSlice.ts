import { createSlice } from '@reduxjs/toolkit';

const quoteSlice = createSlice({
  name: 'quotes',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default quoteSlice.reducer;
