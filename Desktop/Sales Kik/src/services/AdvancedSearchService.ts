// Advanced Search Service for Purchase Orders
// Full-text search, saved filters, search history, and intelligent ranking

export interface SearchFilter {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  isDefault: boolean;
  filters: {
    textSearch?: string;
    suppliers?: string[];
    statuses?: string[];
    priorities?: string[];
    customers?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    amountRange?: {
      min: number;
      max: number;
    };
    customFilters?: {
      field: string;
      operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
      value: any;
    }[];
  };
  tags: string[];
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchHistory {
  id: string;
  userId: string;
  searchTerm: string;
  filters: SearchFilter['filters'];
  resultCount: number;
  searchDuration: number; // milliseconds
  selectedResults: string[]; // Purchase order IDs that were clicked
  timestamp: Date;
  source: 'MANUAL' | 'SUGGESTION' | 'SAVED_FILTER';
}

export interface SearchSuggestion {
  type: 'TERM' | 'FILTER' | 'SUPPLIER' | 'CUSTOMER' | 'STATUS';
  value: string;
  label: string;
  description?: string;
  confidence: number; // 0-1
  usageFrequency: number;
  lastUsed?: Date;
}

export interface SearchResult {
  purchaseOrder: any;
  relevanceScore: number;
  matchReasons: Array<{
    field: string;
    matchType: 'EXACT' | 'PARTIAL' | 'FUZZY' | 'SEMANTIC';
    confidence: number;
    highlightedText?: string;
  }>;
  searchSnippets: Array<{
    field: string;
    snippet: string;
    highlighted: boolean;
  }>;
}

export interface AdvancedSearchQuery {
  textSearch?: string;
  filters?: SearchFilter['filters'];
  sortBy?: 'RELEVANCE' | 'DATE' | 'AMOUNT' | 'SUPPLIER' | 'STATUS';
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
  searchMode?: 'SIMPLE' | 'ADVANCED' | 'EXPERT';
}

class AdvancedSearchService {
  private static instance: AdvancedSearchService;
  private savedFilters: Map<string, SearchFilter> = new Map();
  private searchHistory: SearchHistory[] = [];
  private searchIndex: Map<string, Set<string>> = new Map(); // Term -> Set of purchase order IDs
  private currentUserId: string = 'current-user';

  private constructor() {
    this.loadSavedFilters();
    this.loadSearchHistory();
    this.buildSearchIndex();
    this.createDefaultFilters();
  }

  public static getInstance(): AdvancedSearchService {
    if (!AdvancedSearchService.instance) {
      AdvancedSearchService.instance = new AdvancedSearchService();
    }
    return AdvancedSearchService.instance;
  }

  private loadSavedFilters(): void {
    const saved = localStorage.getItem('saleskik-saved-search-filters');
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        filters.forEach((filter: any) => {
          this.savedFilters.set(filter.id, {
            ...filter,
            dateRange: filter.filters.dateRange ? {
              start: new Date(filter.filters.dateRange.start),
              end: new Date(filter.filters.dateRange.end)
            } : undefined,
            lastUsed: new Date(filter.lastUsed),
            createdAt: new Date(filter.createdAt),
            updatedAt: new Date(filter.updatedAt)
          });
        });
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }

  private loadSearchHistory(): void {
    const saved = localStorage.getItem('saleskik-search-history');
    if (saved) {
      try {
        this.searchHistory = JSON.parse(saved).map((history: any) => ({
          ...history,
          timestamp: new Date(history.timestamp),
          filters: {
            ...history.filters,
            dateRange: history.filters.dateRange ? {
              start: new Date(history.filters.dateRange.start),
              end: new Date(history.filters.dateRange.end)
            } : undefined
          }
        }));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }

  // Build search index for fast full-text search
  private buildSearchIndex(): void {
    const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    
    purchaseOrders.forEach((order: any) => {
      const searchableText = this.extractSearchableText(order);
      const terms = this.tokenize(searchableText);
      
      terms.forEach(term => {
        if (!this.searchIndex.has(term)) {
          this.searchIndex.set(term, new Set());
        }
        this.searchIndex.get(term)!.add(order.id);
      });
    });

    console.log(`Search index built: ${this.searchIndex.size} terms indexing ${purchaseOrders.length} orders`);
  }

  private extractSearchableText(order: any): string {
    const fields = [
      order.purchaseOrderNumber,
      order.supplier?.supplierName,
      order.supplier?.supplierCode,
      order.customerName,
      order.customerReference,
      order.shippingInstructions,
      order.internalNotes,
      order.status,
      order.priorityLevel,
      ...(order.lineItems?.map((item: any) => [
        item.product?.name,
        item.product?.sku,
        item.product?.description,
        item.specialInstructions
      ]).flat() || [])
    ];

    return fields.filter(Boolean).join(' ').toLowerCase();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length >= 2) // Minimum 2 characters
      .filter(term => !this.isStopWord(term));
  }

  private isStopWord(term: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'order', 'purchase', 'supplier', 'customer', 'item', 'product'
    ]);
    return stopWords.has(term);
  }

  private createDefaultFilters(): void {
    // Create default filters if none exist
    if (this.savedFilters.size === 0) {
      const defaultFilters: Omit<SearchFilter, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Urgent Orders',
          description: 'All urgent priority purchase orders',
          userId: this.currentUserId,
          isPublic: true,
          isDefault: true,
          filters: {
            priorities: ['URGENT']
          },
          tags: ['urgent', 'priority'],
          usageCount: 0,
          lastUsed: new Date()
        },
        {
          name: 'Pending Approvals',
          description: 'Orders awaiting manager approval',
          userId: this.currentUserId,
          isPublic: true,
          isDefault: true,
          filters: {
            statuses: ['PENDING_APPROVAL']
          },
          tags: ['approval', 'pending'],
          usageCount: 0,
          lastUsed: new Date()
        },
        {
          name: 'Overdue Confirmations',
          description: 'Orders with overdue supplier confirmations',
          userId: this.currentUserId,
          isPublic: true,
          isDefault: true,
          filters: {
            statuses: ['CONFIRMATION_OVERDUE']
          },
          tags: ['overdue', 'supplier'],
          usageCount: 0,
          lastUsed: new Date()
        },
        {
          name: 'High Value Orders',
          description: 'Orders over $10,000',
          userId: this.currentUserId,
          isPublic: true,
          isDefault: true,
          filters: {
            amountRange: { min: 10000, max: 999999999 }
          },
          tags: ['high-value', 'financial'],
          usageCount: 0,
          lastUsed: new Date()
        },
        {
          name: 'Glass Specialist Orders',
          description: 'Orders from glass specialist suppliers',
          userId: this.currentUserId,
          isPublic: true,
          isDefault: true,
          filters: {
            textSearch: 'glass specialist'
          },
          tags: ['glass', 'specialist'],
          usageCount: 0,
          lastUsed: new Date()
        }
      ];

      defaultFilters.forEach(filterData => {
        const filter: SearchFilter = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...filterData
        };
        this.savedFilters.set(filter.id, filter);
      });

      this.saveSavedFilters();
    }
  }

  // Main search method
  public async performSearch(query: AdvancedSearchQuery): Promise<{
    results: SearchResult[];
    totalCount: number;
    searchDuration: number;
    suggestions: SearchSuggestion[];
    appliedFilters: string[];
  }> {
    const startTime = Date.now();
    
    try {
      // Get base data
      const purchaseOrders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
      let filteredOrders = [...purchaseOrders];

      // Apply filters
      const appliedFilters: string[] = [];
      
      if (query.filters) {
        filteredOrders = this.applyFilters(filteredOrders, query.filters, appliedFilters);
      }

      // Perform full-text search
      let searchResults: SearchResult[] = [];
      
      if (query.textSearch && query.textSearch.trim()) {
        searchResults = await this.performFullTextSearch(filteredOrders, query.textSearch);
        appliedFilters.push(`Text: "${query.textSearch}"`);
      } else {
        // Convert to search results without text search
        searchResults = filteredOrders.map((order: any) => ({
          purchaseOrder: order,
          relevanceScore: 1.0,
          matchReasons: [],
          searchSnippets: []
        }));
      }

      // Sort results
      searchResults = this.sortSearchResults(searchResults, query.sortBy, query.sortDirection);

      // Apply pagination
      const totalCount = searchResults.length;
      const limit = query.limit || 50;
      const offset = query.offset || 0;
      const paginatedResults = searchResults.slice(offset, offset + limit);

      // Generate search suggestions
      const suggestions = await this.generateSearchSuggestions(query.textSearch || '');

      const searchDuration = Date.now() - startTime;

      // Record search in history
      this.recordSearchHistory({
        searchTerm: query.textSearch || '',
        filters: query.filters || {},
        resultCount: totalCount,
        searchDuration,
        selectedResults: [],
        source: 'MANUAL'
      });

      return {
        results: paginatedResults,
        totalCount,
        searchDuration,
        suggestions,
        appliedFilters
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  private applyFilters(orders: any[], filters: SearchFilter['filters'], appliedFilters: string[]): any[] {
    let filtered = orders;

    // Supplier filter
    if (filters.suppliers && filters.suppliers.length > 0) {
      filtered = filtered.filter(order => filters.suppliers!.includes(order.supplier.id));
      appliedFilters.push(`Suppliers: ${filters.suppliers.length} selected`);
    }

    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter(order => filters.statuses!.includes(order.status));
      appliedFilters.push(`Status: ${filters.statuses.join(', ')}`);
    }

    // Priority filter
    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter(order => filters.priorities!.includes(order.priorityLevel));
      appliedFilters.push(`Priority: ${filters.priorities.join(', ')}`);
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= filters.dateRange!.start && orderDate <= filters.dateRange!.end;
      });
      appliedFilters.push(`Date: ${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`);
    }

    // Amount range filter
    if (filters.amountRange) {
      filtered = filtered.filter(order => 
        order.totalAmount >= filters.amountRange!.min && 
        order.totalAmount <= filters.amountRange!.max
      );
      appliedFilters.push(`Amount: $${filters.amountRange.min.toLocaleString()} - $${filters.amountRange.max.toLocaleString()}`);
    }

    // Customer filter
    if (filters.customers && filters.customers.length > 0) {
      filtered = filtered.filter(order => 
        order.customerId && filters.customers!.includes(order.customerId)
      );
      appliedFilters.push(`Customers: ${filters.customers.length} selected`);
    }

    // Custom filters
    if (filters.customFilters && filters.customFilters.length > 0) {
      filtered = this.applyCustomFilters(filtered, filters.customFilters);
      appliedFilters.push(`Custom: ${filters.customFilters.length} rule${filters.customFilters.length !== 1 ? 's' : ''}`);
    }

    return filtered;
  }

  private applyCustomFilters(orders: any[], customFilters: any[]): any[] {
    return orders.filter(order => {
      return customFilters.every(filter => {
        const fieldValue = this.getNestedValue(order, filter.field);
        return this.evaluateFilterCondition(fieldValue, filter.operator, filter.value);
      });
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateFilterCondition(fieldValue: any, operator: string, filterValue: any): boolean {
    if (fieldValue === null || fieldValue === undefined) return false;

    const fieldStr = String(fieldValue).toLowerCase();
    const filterStr = String(filterValue).toLowerCase();

    switch (operator) {
      case 'equals':
        return fieldValue === filterValue;
      case 'contains':
        return fieldStr.includes(filterStr);
      case 'startsWith':
        return fieldStr.startsWith(filterStr);
      case 'endsWith':
        return fieldStr.endsWith(filterStr);
      case 'greaterThan':
        return Number(fieldValue) > Number(filterValue);
      case 'lessThan':
        return Number(fieldValue) < Number(filterValue);
      case 'between':
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const numValue = Number(fieldValue);
          return numValue >= Number(filterValue[0]) && numValue <= Number(filterValue[1]);
        }
        return false;
      default:
        return false;
    }
  }

  // Full-text search with relevance ranking
  private async performFullTextSearch(orders: any[], searchTerm: string): Promise<SearchResult[]> {
    const searchTokens = this.tokenize(searchTerm);
    const results: SearchResult[] = [];

    orders.forEach((order: any) => {
      const matchResult = this.calculateRelevanceScore(order, searchTokens, searchTerm);
      
      if (matchResult.relevanceScore > 0) {
        results.push({
          purchaseOrder: order,
          relevanceScore: matchResult.relevanceScore,
          matchReasons: matchResult.matchReasons,
          searchSnippets: matchResult.searchSnippets
        });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateRelevanceScore(order: any, searchTokens: string[], originalSearchTerm: string): {
    relevanceScore: number;
    matchReasons: SearchResult['matchReasons'];
    searchSnippets: SearchResult['searchSnippets'];
  } {
    let score = 0;
    const matchReasons: SearchResult['matchReasons'] = [];
    const searchSnippets: SearchResult['searchSnippets'] = [];

    const searchableFields = {
      purchaseOrderNumber: { text: order.purchaseOrderNumber || '', weight: 10 },
      supplierName: { text: order.supplier?.supplierName || '', weight: 8 },
      supplierCode: { text: order.supplier?.supplierCode || '', weight: 6 },
      customerName: { text: order.customerName || '', weight: 7 },
      customerReference: { text: order.customerReference || '', weight: 5 },
      shippingInstructions: { text: order.shippingInstructions || '', weight: 3 },
      internalNotes: { text: order.internalNotes || '', weight: 2 },
      lineItems: { 
        text: order.lineItems?.map((item: any) => 
          `${item.product?.name} ${item.product?.sku} ${item.product?.description}`
        ).join(' ') || '', 
        weight: 4 
      }
    };

    // Check exact matches first (highest relevance)
    Object.entries(searchableFields).forEach(([field, fieldData]) => {
      const fieldText = fieldData.text.toLowerCase();
      const searchLower = originalSearchTerm.toLowerCase();
      
      if (fieldText.includes(searchLower)) {
        const exactMatch = fieldText === searchLower;
        const startsWithMatch = fieldText.startsWith(searchLower);
        
        let fieldScore = 0;
        let matchType: 'EXACT' | 'PARTIAL' | 'FUZZY' | 'SEMANTIC' = 'PARTIAL';
        
        if (exactMatch) {
          fieldScore = fieldData.weight * 2;
          matchType = 'EXACT';
        } else if (startsWithMatch) {
          fieldScore = fieldData.weight * 1.5;
          matchType = 'PARTIAL';
        } else {
          fieldScore = fieldData.weight;
          matchType = 'PARTIAL';
        }
        
        score += fieldScore;
        
        matchReasons.push({
          field,
          matchType,
          confidence: exactMatch ? 1.0 : startsWithMatch ? 0.8 : 0.6,
          highlightedText: this.highlightMatch(fieldText, searchLower)
        });

        // Create search snippet
        const snippet = this.createSearchSnippet(fieldText, searchLower);
        if (snippet) {
          searchSnippets.push({
            field,
            snippet,
            highlighted: true
          });
        }
      }
    });

    // Check individual token matches
    searchTokens.forEach(token => {
      Object.entries(searchableFields).forEach(([field, fieldData]) => {
        const fieldText = fieldData.text.toLowerCase();
        
        if (fieldText.includes(token)) {
          score += fieldData.weight * 0.5; // Lower weight for individual tokens
        }
      });
    });

    // Boost score for recent orders
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const daysSinceCreated = orderAge / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) {
      score *= 1.2; // 20% boost for orders created in last 30 days
    }

    // Boost score for urgent orders
    if (order.priorityLevel === 'URGENT') {
      score *= 1.3;
    }

    return {
      relevanceScore: Math.min(100, score), // Cap at 100
      matchReasons,
      searchSnippets
    };
  }

  private highlightMatch(text: string, searchTerm: string): string {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private createSearchSnippet(text: string, searchTerm: string, maxLength: number = 150): string | null {
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return null;

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + searchTerm.length + 50);
    
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet.substring(0, maxLength);
  }

  private sortSearchResults(results: SearchResult[], sortBy?: string, direction?: string): SearchResult[] {
    const dir = direction === 'ASC' ? 1 : -1;

    return results.sort((a, b) => {
      switch (sortBy) {
        case 'DATE':
          const dateA = new Date(a.purchaseOrder.createdAt).getTime();
          const dateB = new Date(b.purchaseOrder.createdAt).getTime();
          return (dateB - dateA) * dir;
        
        case 'AMOUNT':
          return (b.purchaseOrder.totalAmount - a.purchaseOrder.totalAmount) * dir;
        
        case 'SUPPLIER':
          return a.purchaseOrder.supplier.supplierName.localeCompare(b.purchaseOrder.supplier.supplierName) * dir;
        
        case 'STATUS':
          return a.purchaseOrder.status.localeCompare(b.purchaseOrder.status) * dir;
        
        case 'RELEVANCE':
        default:
          return b.relevanceScore - a.relevanceScore; // Always descending for relevance
      }
    });
  }

  // Generate intelligent search suggestions
  private async generateSearchSuggestions(searchTerm: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const searchLower = searchTerm.toLowerCase();

    // Recent search suggestions
    const recentSearches = this.searchHistory
      .filter(history => history.userId === this.currentUserId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    recentSearches.forEach(history => {
      if (history.searchTerm.toLowerCase().includes(searchLower) || searchLower.includes(history.searchTerm.toLowerCase())) {
        suggestions.push({
          type: 'TERM',
          value: history.searchTerm,
          label: history.searchTerm,
          description: `${history.resultCount} results`,
          confidence: 0.8,
          usageFrequency: 1,
          lastUsed: history.timestamp
        });
      }
    });

    // Supplier suggestions
    const suppliers = JSON.parse(localStorage.getItem('saleskik-suppliers') || '[]');
    suppliers.forEach((supplier: any) => {
      const supplierName = supplier.supplierName || supplier.name || '';
      if (supplierName.toLowerCase().includes(searchLower)) {
        suggestions.push({
          type: 'SUPPLIER',
          value: supplier.id,
          label: supplierName,
          description: `Filter by supplier: ${supplierName}`,
          confidence: 0.9,
          usageFrequency: supplier.totalOrdersCount || 0
        });
      }
    });

    // Status suggestions
    const statuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_SUPPLIER', 'SUPPLIER_CONFIRMED', 'COMPLETED'];
    statuses.forEach(status => {
      if (status.toLowerCase().includes(searchLower)) {
        suggestions.push({
          type: 'STATUS',
          value: status,
          label: status.replace('_', ' '),
          description: `Filter by status: ${status.replace('_', ' ')}`,
          confidence: 0.7,
          usageFrequency: this.getStatusUsageFrequency(status)
        });
      }
    });

    // Saved filter suggestions
    this.savedFilters.forEach(filter => {
      if (filter.name.toLowerCase().includes(searchLower) || 
          filter.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
        suggestions.push({
          type: 'FILTER',
          value: filter.id,
          label: filter.name,
          description: filter.description || 'Saved filter',
          confidence: 0.6,
          usageFrequency: filter.usageCount
        });
      }
    });

    // Sort suggestions by confidence and usage
    return suggestions
      .sort((a, b) => (b.confidence * 100 + b.usageFrequency) - (a.confidence * 100 + a.usageFrequency))
      .slice(0, 10); // Top 10 suggestions
  }

  private getStatusUsageFrequency(status: string): number {
    const orders = JSON.parse(localStorage.getItem('saleskik-purchase-orders') || '[]');
    return orders.filter((order: any) => order.status === status).length;
  }

  // Saved filter management
  public saveFilter(filterData: Omit<SearchFilter, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed'>): string {
    const filter: SearchFilter = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      usageCount: 0,
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...filterData
    };

    this.savedFilters.set(filter.id, filter);
    this.saveSavedFilters();

    console.log(`Saved filter: ${filter.name}`);
    return filter.id;
  }

  public updateFilter(filterId: string, updates: Partial<SearchFilter>): boolean {
    const filter = this.savedFilters.get(filterId);
    if (!filter) return false;

    const updatedFilter = {
      ...filter,
      ...updates,
      updatedAt: new Date()
    };

    this.savedFilters.set(filterId, updatedFilter);
    this.saveSavedFilters();
    return true;
  }

  public deleteFilter(filterId: string): boolean {
    const deleted = this.savedFilters.delete(filterId);
    if (deleted) {
      this.saveSavedFilters();
    }
    return deleted;
  }

  public applySavedFilter(filterId: string): SearchFilter | null {
    const filter = this.savedFilters.get(filterId);
    if (!filter) return null;

    // Update usage statistics
    filter.usageCount++;
    filter.lastUsed = new Date();
    this.savedFilters.set(filterId, filter);
    this.saveSavedFilters();

    return filter;
  }

  // Search history management
  private recordSearchHistory(historyData: Omit<SearchHistory, 'id' | 'userId' | 'timestamp'>): void {
    const history: SearchHistory = {
      id: Date.now().toString(),
      userId: this.currentUserId,
      timestamp: new Date(),
      ...historyData
    };

    this.searchHistory.unshift(history); // Add to beginning
    
    // Keep only last 100 searches per user
    const userHistory = this.searchHistory.filter(h => h.userId === this.currentUserId);
    if (userHistory.length > 100) {
      this.searchHistory = this.searchHistory.filter(h => 
        h.userId !== this.currentUserId || userHistory.slice(0, 100).includes(h)
      );
    }

    this.saveSearchHistory();
  }

  public markSearchResultSelected(searchHistoryId: string, purchaseOrderId: string): void {
    const history = this.searchHistory.find(h => h.id === searchHistoryId);
    if (history) {
      history.selectedResults.push(purchaseOrderId);
      this.saveSearchHistory();
    }
  }

  // Public API methods
  public getSavedFilters(userId?: string): SearchFilter[] {
    const filters = Array.from(this.savedFilters.values());
    
    if (userId) {
      return filters.filter(filter => 
        filter.userId === userId || filter.isPublic
      );
    }
    
    return filters.filter(filter => 
      filter.userId === this.currentUserId || filter.isPublic
    );
  }

  public getSearchHistory(userId?: string, limit?: number): SearchHistory[] {
    let history = [...this.searchHistory];
    
    if (userId) {
      history = history.filter(h => h.userId === userId);
    } else {
      history = history.filter(h => h.userId === this.currentUserId);
    }

    history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? history.slice(0, limit) : history;
  }

  public getSearchStatistics(): {
    totalSearches: number;
    averageSearchTime: number;
    mostPopularTerms: Array<{ term: string; count: number }>;
    mostUsedFilters: Array<{ name: string; usageCount: number }>;
    searchSuccessRate: number;
    savedFiltersCount: number;
  } {
    const userHistory = this.searchHistory.filter(h => h.userId === this.currentUserId);
    
    const averageSearchTime = userHistory.length > 0
      ? userHistory.reduce((sum, h) => sum + h.searchDuration, 0) / userHistory.length
      : 0;

    // Count popular terms
    const termCounts = new Map<string, number>();
    userHistory.forEach(history => {
      if (history.searchTerm) {
        termCounts.set(history.searchTerm, (termCounts.get(history.searchTerm) || 0) + 1);
      }
    });

    const mostPopularTerms = Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const mostUsedFilters = Array.from(this.savedFilters.values())
      .filter(filter => filter.userId === this.currentUserId)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(filter => ({ name: filter.name, usageCount: filter.usageCount }));

    const searchSuccessRate = userHistory.length > 0
      ? (userHistory.filter(h => h.resultCount > 0).length / userHistory.length) * 100
      : 0;

    return {
      totalSearches: userHistory.length,
      averageSearchTime,
      mostPopularTerms,
      mostUsedFilters,
      searchSuccessRate,
      savedFiltersCount: Array.from(this.savedFilters.values()).filter(f => f.userId === this.currentUserId).length
    };
  }

  // Storage methods
  private saveSavedFilters(): void {
    const filters = Array.from(this.savedFilters.values());
    localStorage.setItem('saleskik-saved-search-filters', JSON.stringify(filters));
  }

  private saveSearchHistory(): void {
    localStorage.setItem('saleskik-search-history', JSON.stringify(this.searchHistory));
  }

  // Index maintenance
  public rebuildSearchIndex(): void {
    this.searchIndex.clear();
    this.buildSearchIndex();
    console.log('Search index rebuilt');
  }

  public addToSearchIndex(purchaseOrder: any): void {
    const searchableText = this.extractSearchableText(purchaseOrder);
    const terms = this.tokenize(searchableText);
    
    terms.forEach(term => {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(purchaseOrder.id);
    });
  }

  public removeFromSearchIndex(purchaseOrderId: string): void {
    this.searchIndex.forEach(orderIds => {
      orderIds.delete(purchaseOrderId);
    });
  }
}

export default AdvancedSearchService;