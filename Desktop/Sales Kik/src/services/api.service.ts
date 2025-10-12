// API Service Layer - Maintains exact same functionality as localStorage
// NO VISUAL CHANGES - Only changes where data is stored/retrieved

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json'
});

export const apiService = {
  // Quotes API - Drop-in replacement for localStorage
  quotes: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/api/quotes`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load quotes');
    },

    create: async (quoteData: any) => {
      const response = await fetch(`${API_BASE}/api/quotes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(quoteData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create quote');
    },

    update: async (id: string, quoteData: any) => {
      const response = await fetch(`${API_BASE}/api/quotes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(quoteData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update quote');
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/quotes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }
    }
  },

  // Orders API - Drop-in replacement for localStorage
  orders: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/api/orders`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load orders');
    },

    create: async (orderData: any) => {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create order');
    },

    update: async (id: string, orderData: any) => {
      const response = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update order');
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to delete order');
      }
    }
  },

  // Customers API - Drop-in replacement for localStorage
  customers: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/api/customers`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load customers');
    },

    create: async (customerData: any) => {
      const response = await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(customerData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create customer');
    },

    update: async (id: string, customerData: any) => {
      const response = await fetch(`${API_BASE}/api/customers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(customerData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update customer');
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/customers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }
    }
  },

  locations: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/api/locations`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load locations');
    },

    create: async (locationData: any) => {
      const response = await fetch(`${API_BASE}/api/locations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(locationData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create location');
    },

    update: async (id: string, locationData: any) => {
      const response = await fetch(`${API_BASE}/api/locations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(locationData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update location');
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/locations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to delete location');
      }
    }
  },

  invoices: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/api/invoices`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load invoices');
    },

    create: async (invoiceData: any) => {
      const response = await fetch(`${API_BASE}/api/invoices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(invoiceData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create invoice');
    },

    update: async (id: string, invoiceData: any) => {
      const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(invoiceData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update invoice');
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }
    }
  },

  products: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/api/products`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load products');
    },

    create: async (productData: any) => {
      const response = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create product');
    },

    update: async (id: string, productData: any) => {
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update product');
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
    }
  },

  categories: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE}/api/category/structure`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error('Failed to load categories');
      } catch (error) {
        console.warn('API unavailable, using localStorage fallback');
        const saved = localStorage.getItem('saleskik-categories');
        return saved ? JSON.parse(saved) : [];
      }
    },

    create: async (categoryData: any) => {
      const response = await fetch(`${API_BASE}/api/category/structure`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create category');
    },

    update: async (id: string, categoryData: any) => {
      const response = await fetch(`${API_BASE}/api/category/structure/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update category');
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/category/structure/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
    },

    save: async (categories: any[]) => {
      try {
        console.log('Saving categories (database-first approach):', categories.length, 'categories');
        
        // NEW APPROACH: Try database first, fallback to localStorage
        const token = localStorage.getItem('accessToken');
        if (token && categories.length > 0) {
          let successCount = 0;
          for (const category of categories) {
            if (category.name && !category.synced) {
              try {
                const response = await fetch(`${API_BASE}/api/category/structure`, {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    name: category.name,
                    color: category.color,
                    sortOrder: category.sortOrder || 0
                  })
                });
                
                if (response.ok) {
                  successCount++;
                  console.log('✅ Category saved to database:', category.name);
                } else {
                  console.warn('❌ Failed to save category to database:', category.name);
                }
              } catch (error) {
                console.warn('❌ Database save error for category:', category.name, error);
              }
            }
          }
          
          if (successCount > 0) {
            console.log(`✅ Successfully saved ${successCount}/${categories.length} categories to database`);
            return; // Don't save to localStorage if database worked
          }
        }
        
        // Fallback to localStorage only if database failed
        localStorage.setItem('saleskik-categories', JSON.stringify(categories));
        console.log('⚠️ Saved to localStorage as fallback');
      } catch (error) {
        console.error('Category save error:', error);
        // Final fallback
        localStorage.setItem('saleskik-categories', JSON.stringify(categories));
        console.warn('Category API sync failed, using localStorage');
      }
    },

    deleteCategory: async (categoryId: string) => {
      try {
        const response = await fetch(`${API_BASE}/api/category/structure/${categoryId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          console.log('✅ Category deleted from database:', categoryId);
          return true;
        } else {
          console.warn('❌ Failed to delete category from database');
          return false;
        }
      } catch (error) {
        console.error('❌ Error deleting category:', error);
        return false;
      }
    }
  }
};

// Fallback helper - tries API first, falls back to localStorage
export const dataService = {
  quotes: {
    getAll: async () => {
      try {
        return await apiService.quotes.getAll();
      } catch (error) {
        console.warn('API unavailable, using localStorage fallback');
        const saved = localStorage.getItem('saleskik-quotes');
        return saved ? JSON.parse(saved) : [];
      }
    },

    save: async (quotes: any[]) => {
      try {
        // Try to sync each quote to API
        for (const quote of quotes) {
          if (quote.id && !quote.synced) {
            await apiService.quotes.create(quote);
          }
        }
      } catch (error) {
        console.warn('API sync failed, using localStorage');
      }
      // Always save to localStorage as backup
      localStorage.setItem('saleskik-quotes', JSON.stringify(quotes));
    }
  },

  orders: {
    getAll: async () => {
      try {
        return await apiService.orders.getAll();
      } catch (error) {
        console.warn('API unavailable, using localStorage fallback');
        const saved = localStorage.getItem('saleskik-orders');
        return saved ? JSON.parse(saved) : [];
      }
    },

    save: async (orders: any[]) => {
      try {
        for (const order of orders) {
          if (order.id && !order.synced) {
            await apiService.orders.create(order);
          }
        }
      } catch (error) {
        console.warn('API sync failed, using localStorage');
      }
      localStorage.setItem('saleskik-orders', JSON.stringify(orders));
    }
  },

  invoices: {
    getAll: async () => {
      try {
        return await apiService.invoices.getAll();
      } catch (error) {
        console.warn('API unavailable, using localStorage fallback');
        const saved = localStorage.getItem('saleskik-invoices');
        return saved ? JSON.parse(saved) : [];
      }
    },

    save: async (invoices: any[]) => {
      try {
        for (const invoice of invoices) {
          if (invoice.id && !invoice.synced) {
            await apiService.invoices.create(invoice);
          }
        }
      } catch (error) {
        console.warn('API sync failed, using localStorage');
      }
      localStorage.setItem('saleskik-invoices', JSON.stringify(invoices));
    }
  },

  customers: {
    getAll: async () => {
      try {
        const result = await apiService.customers.getAll();
        console.log('Customers dataService received from API:', result);
        // The API returns { success: true, data: [...] }, but we need the data array
        return result.data || result;
      } catch (error) {
        console.warn('API unavailable, using localStorage fallback');
        const saved = localStorage.getItem('saleskik-customers');
        return saved ? JSON.parse(saved) : [];
      }
    },

    save: async (customers: any[]) => {
      try {
        for (const customer of customers) {
          if (customer.id && !customer.synced) {
            await apiService.customers.create(customer);
          }
        }
      } catch (error) {
        console.warn('API sync failed, using localStorage');
      }
      localStorage.setItem('saleskik-customers', JSON.stringify(customers));
    }
  },

  locations: {
    getAll: async () => {
      try {
        return await apiService.locations.getAll();
      } catch (error) {
        console.warn('API unavailable, using localStorage fallback');
        const saved = localStorage.getItem('saleskik-locations');
        return saved ? JSON.parse(saved) : [];
      }
    },

    save: async (locations: any[]) => {
      try {
        for (const location of locations) {
          if (location.id && !location.synced) {
            await apiService.locations.create(location);
          }
        }
      } catch (error) {
        console.warn('API sync failed, using localStorage');
      }
      localStorage.setItem('saleskik-locations', JSON.stringify(locations));
    }
  },

  products: {
    getAll: async () => {
      try {
        const result = await apiService.products.getAll();
        console.log('Products dataService received from API:', result);
        // The API returns { success: true, data: [...] }, but we need the data array
        return result.data || result;
      } catch (error) {
        console.warn('API unavailable, using localStorage fallback');
        const saved = localStorage.getItem('saleskik-products-structured');
        return saved ? JSON.parse(saved) : [];
      }
    },

    save: async (products: any[]) => {
      try {
        for (const product of products) {
          if (product.id && !product.synced) {
            await apiService.products.create(product);
          }
        }
      } catch (error) {
        console.warn('API sync failed, using localStorage');
      }
      localStorage.setItem('saleskik-products-structured', JSON.stringify(products));
    }
  },

  categories: {
    getAll: async () => {
      try {
        console.log('🔍 dataService: Fetching categories from database API...');
        const response = await fetch(`${API_BASE}/api/category/structure`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ dataService: Categories successfully received from database:', data.length, 'categories');
          console.log('📋 dataService: Category names:', data.map((c: any) => c.name).join(', '));
          return data;
        } else {
          console.error('❌ dataService: API response failed:', response.status, response.statusText);
          throw new Error(`Failed to load categories: ${response.status}`);
        }
      } catch (error) {
        console.warn('❌ dataService: API call failed, checking localStorage fallback:', error);
        const saved = localStorage.getItem('saleskik-categories');
        if (saved) {
          console.log('📁 dataService: Using localStorage fallback with', JSON.parse(saved).length, 'categories');
          return JSON.parse(saved);
        } else {
          console.log('📁 dataService: No localStorage data found, returning empty array');
          return [];
        }
      }
    },

    save: async (categories: any[]) => {
      try {
        console.log('💾 DataService: Saving categories (database-first):', categories.length, 'categories');
        
        // Try to save each category to database first
        const token = localStorage.getItem('accessToken');
        if (token && categories.length > 0) {
          let successCount = 0;
          for (const category of categories) {
            if (category.name && !category.synced) {
              try {
                const response = await fetch(`${API_BASE}/api/category/structure`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    name: category.name,
                    color: category.color,
                    sortOrder: category.sortOrder || 0
                  })
                });
                
                if (response.ok) {
                  successCount++;
                  console.log('✅ DataService: Category saved to database:', category.name);
                } else {
                  console.warn('❌ DataService: Failed to save category:', category.name);
                }
              } catch (error) {
                console.warn('❌ DataService: Database error for category:', category.name, error);
              }
            }
          }
          
          if (successCount > 0) {
            console.log(`✅ DataService: Successfully saved ${successCount}/${categories.length} categories to database`);
            return; // Don't save to localStorage if database worked
          }
        }
        
        // Fallback to localStorage only if database completely failed
        localStorage.setItem('saleskik-categories', JSON.stringify(categories));
        console.log('⚠️ DataService: Saved to localStorage as fallback');
      } catch (error) {
        console.error('DataService: Category save error:', error);
        // Final fallback
        localStorage.setItem('saleskik-categories', JSON.stringify(categories));
        console.warn('DataService: Using localStorage fallback');
      }
    }
  },

  // Transfer Requests API
  transfers: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE}/api/transfers`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error('Failed to load transfers');
      } catch (error) {
        console.warn('Transfers API unavailable, using localStorage fallback');
        const saved = localStorage.getItem('saleskik-transfers');
        return saved ? JSON.parse(saved) : [];
      }
    },

    create: async (transferData: any) => {
      try {
        const response = await fetch(`${API_BASE}/api/transfers`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(transferData)
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error('Failed to create transfer');
      } catch (error) {
        console.warn('Transfers API unavailable, using localStorage fallback');
        const existing = localStorage.getItem('saleskik-transfers');
        const transfers = existing ? JSON.parse(existing) : [];
        const newTransfer = { ...transferData, id: `TR-${Date.now()}` };
        transfers.unshift(newTransfer);
        localStorage.setItem('saleskik-transfers', JSON.stringify(transfers));
        return newTransfer;
      }
    },

    updateStatus: async (id: string, status: string, approvedBy?: string) => {
      try {
        const response = await fetch(`${API_BASE}/api/transfers/${id}/status`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status, approvedBy })
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error('Failed to update transfer status');
      } catch (error) {
        console.warn('Transfers API unavailable, using localStorage fallback');
        const existing = localStorage.getItem('saleskik-transfers');
        const transfers = existing ? JSON.parse(existing) : [];
        const updated = transfers.map((t: any) => 
          t.id === id 
            ? { 
                ...t, 
                status,
                ...(status === 'approved' && { approvedAt: new Date().toISOString(), approvedBy }),
                ...(status === 'rejected' && { rejectedAt: new Date().toISOString(), rejectedBy: approvedBy })
              }
            : t
        );
        localStorage.setItem('saleskik-transfers', JSON.stringify(updated));
        return updated.find((t: any) => t.id === id);
      }
    }
  },

  suppliers: {
    getAll: async () => {
      try {
        console.log('🏭 dataService: Fetching suppliers from database API...');
        const response = await fetch(`${API_BASE}/api/suppliers`);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ dataService: Suppliers successfully received from database:', result.data?.length || 0, 'suppliers');
          return result.data || [];
        } else {
          console.error('❌ dataService: Suppliers API response failed:', response.status, response.statusText);
          throw new Error(`Failed to load suppliers: ${response.status}`);
        }
      } catch (error) {
        console.warn('❌ dataService: Suppliers API call failed, checking localStorage fallback:', error);
        const saved = localStorage.getItem('saleskik-suppliers');
        if (saved) {
          console.log('📁 dataService: Using localStorage fallback with', JSON.parse(saved).length, 'suppliers');
          return JSON.parse(saved);
        } else {
          console.log('📁 dataService: No localStorage suppliers data found, returning empty array');
          return [];
        }
      }
    },

    save: async (suppliers: any[]) => {
      try {
        console.log('💾 DataService: Saving suppliers (database-first):', suppliers.length, 'suppliers');
        
        // Always save to localStorage as backup first
        localStorage.setItem('saleskik-suppliers', JSON.stringify(suppliers));
        
        // Try to sync to database
        let successCount = 0;
        for (const supplier of suppliers) {
          if (supplier.id && !supplier.synced) {
            try {
              console.log('💾 Syncing supplier to database:', supplier.name);
              const response = await fetch(`${API_BASE}/api/suppliers`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(supplier)
              });
              
              if (response.ok) {
                console.log('✅ Supplier synced to database successfully');
                supplier.synced = true;
                successCount++;
              } else {
                console.error('❌ Failed to sync supplier to database');
              }
            } catch (error) {
              console.error('❌ Database sync error for supplier:', error);
            }
          }
        }
        
        if (successCount > 0) {
          console.log(`✅ Successfully synced ${successCount}/${suppliers.length} suppliers to database`);
          // Update localStorage with synced status
          localStorage.setItem('saleskik-suppliers', JSON.stringify(suppliers));
        }
      } catch (error) {
        console.error('❌ Error saving suppliers:', error);
      }
    },

    create: async (supplierData: any) => {
      try {
        console.log('🏭 Creating new supplier via API:', supplierData.name);
        const response = await fetch(`${API_BASE}/api/suppliers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(supplierData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Supplier created successfully:', result.data.id);
          return result.data;
        } else {
          const error = await response.json();
          console.error('❌ Failed to create supplier:', error);
          throw new Error(error.error || 'Failed to create supplier');
        }
      } catch (error) {
        console.error('❌ Supplier creation error:', error);
        throw error;
      }
    },

    update: async (id: string, supplierData: any) => {
      try {
        console.log('📝 Updating supplier via API:', id, supplierData.name);
        const response = await fetch(`${API_BASE}/api/suppliers/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(supplierData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Supplier updated successfully:', result.data.id);
          return result.data;
        } else {
          const error = await response.json();
          console.error('❌ Failed to update supplier:', error);
          throw new Error(error.error || 'Failed to update supplier');
        }
      } catch (error) {
        console.error('❌ Supplier update error:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      try {
        console.log('🗑️ Deleting supplier:', id);
        const response = await fetch(`${API_BASE}/api/suppliers/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete supplier');
        }
        
        console.log('✅ Supplier deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting supplier:', error);
        throw error;
      }
    }
  }
};