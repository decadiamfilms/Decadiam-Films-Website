import { createSlice } from '@reduxjs/toolkit';

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default invoiceSlice.reducer;
