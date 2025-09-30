import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.PROD ? (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api' : '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Company', 'Customer', 'Product', 'Quote', 'Order', 'Invoice', 'User'],
  endpoints: (builder) => ({
    // Company endpoints
    getCompany: builder.query({
      query: () => '/company',
      providesTags: ['Company'],
    }),
    updateCompany: builder.mutation({
      query: (data) => ({
        url: '/company',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Company'],
    }),

    // Customer endpoints
    getCustomers: builder.query({
      query: (params) => ({
        url: '/customers',
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation({
      query: (data) => ({
        url: '/customers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),

    // Product endpoints
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),

    // Quote endpoints
    getQuotes: builder.query({
      query: (params) => ({
        url: '/quotes',
        params,
      }),
      providesTags: ['Quote'],
    }),
    getQuote: builder.query({
      query: (id) => `/quotes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Quote', id }],
    }),
    createQuote: builder.mutation({
      query: (data) => ({
        url: '/quotes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Quote'],
    }),

    // Order endpoints
    getOrders: builder.query({
      query: (params) => ({
        url: '/orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    getOrder: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    // Invoice endpoints
    getInvoices: builder.query({
      query: (params) => ({
        url: '/invoices',
        params,
      }),
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query({
      query: (id) => `/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),
  }),
});

export const {
  useGetCompanyQuery,
  useUpdateCompanyMutation,
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetQuotesQuery,
  useGetQuoteQuery,
  useCreateQuoteMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
} = api;