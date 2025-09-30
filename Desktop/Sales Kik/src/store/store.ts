import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import companyReducer from './slices/companySlice';
import customerReducer from './slices/customerSlice';
import productReducer from './slices/productSlice';
import quoteReducer from './slices/quoteSlice';
import orderReducer from './slices/orderSlice';
import invoiceReducer from './slices/invoiceSlice';
import { api } from './api/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    company: companyReducer,
    customers: customerReducer,
    products: productReducer,
    quotes: quoteReducer,
    orders: orderReducer,
    invoices: invoiceReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled', 'auth/refresh/fulfilled'],
      },
    }).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;