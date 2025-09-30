# SalesKik Purchase Order API Documentation

## Overview

The SalesKik Purchase Order API provides comprehensive RESTful endpoints for managing purchase orders, suppliers, approvals, and procurement workflows. This documentation covers all endpoints, authentication, error handling, and integration examples.

**Base URL:** `https://api.saleskik.com/v1`  
**API Version:** v1.0  
**Content Type:** `application/json`  
**Authentication:** Bearer Token or API Key  

---

## Authentication

### Bearer Token Authentication
```http
Authorization: Bearer <your-access-token>
```

### API Key Authentication
```http
X-API-Key: <your-api-key>
Content-Type: application/json
```

### OAuth 2.0 Scopes
- `purchase-orders:read` - Read purchase order data
- `purchase-orders:write` - Create and update purchase orders
- `purchase-orders:approve` - Approve purchase orders
- `suppliers:read` - Read supplier information
- `suppliers:write` - Manage supplier data
- `admin:full` - Full administrative access

---

## Purchase Orders

### List Purchase Orders
Retrieve a paginated list of purchase orders with optional filtering.

**Endpoint:** `GET /purchase-orders`

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Results per page (default: 20, max: 100)
- `status` (string): Filter by status (multiple values: `?status=DRAFT&status=APPROVED`)
- `supplier_id` (string): Filter by supplier ID
- `priority` (string): Filter by priority level (`NORMAL`, `HIGH`, `URGENT`)
- `created_after` (ISO date): Filter orders created after date
- `created_before` (ISO date): Filter orders created before date
- `min_amount` (number): Minimum order amount
- `max_amount` (number): Maximum order amount
- `search` (string): Full-text search across all fields
- `sort_by` (string): Sort field (`created_at`, `total_amount`, `supplier_name`)
- `sort_direction` (string): Sort direction (`asc`, `desc`)

**Example Request:**
```bash
curl -X GET "https://api.saleskik.com/v1/purchase-orders?status=PENDING_APPROVAL&priority=URGENT&limit=50" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Response Schema:**
```json
{
  "data": [
    {
      "id": "uuid",
      "purchase_order_number": "PO-2024-001",
      "supplier": {
        "id": "uuid",
        "supplier_name": "Premium Glass Solutions",
        "supplier_code": "PGS001",
        "email_address": "orders@premiumglass.com.au",
        "phone_number": "+61 3 9876 5432",
        "is_local_glass_supplier": true,
        "performance_rating": 4.8
      },
      "customer": {
        "id": "uuid",
        "name": "ABC Construction",
        "email": "contact@abcconstruction.com.au"
      },
      "customer_reference": "Project Phoenix - Phase 1",
      "status": "PENDING_APPROVAL",
      "priority_level": "HIGH",
      "total_amount": 15750.00,
      "expected_delivery_date": "2024-02-15",
      "shipping_instructions": "Deliver to site office",
      "internal_notes": "Urgent project requirement",
      "approval_required": true,
      "approved_by": null,
      "approval_date": null,
      "supplier_confirmed_date": null,
      "invoice_required": true,
      "invoice_created": false,
      "dispatch_blocked": true,
      "line_items": [
        {
          "id": "uuid",
          "product_id": "uuid",
          "product": {
            "id": "uuid",
            "name": "12mm Clear Toughened Glass",
            "sku": "12F-CLEAR-T",
            "category_name": "Custom Glass"
          },
          "quantity_ordered": 15,
          "quantity_received": 0,
          "unit_price": 850.00,
          "subtotal": 12750.00,
          "custom_module_flag": true,
          "special_instructions": "Custom cutting required"
        }
      ],
      "attachments": [
        {
          "id": "uuid",
          "original_filename": "technical-drawings.pdf",
          "file_size": 2500000,
          "file_type": "application/pdf",
          "uploaded_by": "user-id",
          "upload_date": "2024-01-11T10:30:00Z",
          "is_included_with_supplier_order": true
        }
      ],
      "created_by": "uuid",
      "created_at": "2024-01-11T09:15:30Z",
      "updated_at": "2024-01-11T09:15:30Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 95,
    "per_page": 20,
    "has_next": true,
    "has_previous": false
  },
  "filters_applied": [
    "Status: PENDING_APPROVAL",
    "Priority: URGENT"
  ],
  "search_metadata": {
    "search_duration_ms": 45,
    "total_indexed_orders": 1250
  }
}
```

**Error Responses:**
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid status value provided",
    "details": {
      "parameter": "status",
      "provided_value": "INVALID_STATUS",
      "valid_values": ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT_TO_SUPPLIER", "SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED", "FULLY_RECEIVED", "INVOICED", "COMPLETED", "CANCELLED"]
    },
    "request_id": "req_123456789"
  }
}
```

### Create Purchase Order
Create a new purchase order with supplier and line items.

**Endpoint:** `POST /purchase-orders`

**Required Scopes:** `purchase-orders:write`

**Request Schema:**
```json
{
  "supplier_id": "uuid",
  "customer_id": "uuid", // Optional
  "customer_reference": "Project Reference", // Optional
  "priority_level": "NORMAL", // NORMAL, HIGH, URGENT
  "expected_delivery_date": "2024-02-15", // Optional ISO date
  "shipping_instructions": "Delivery instructions", // Optional
  "internal_notes": "Internal notes", // Optional
  "line_items": [
    {
      "product_id": "uuid",
      "quantity_ordered": 10,
      "unit_price": 850.00,
      "special_instructions": "Custom requirements", // Optional
      "custom_module_flag": false // Optional
    }
  ],
  "attachments": [ // Optional
    {
      "filename": "specifications.pdf",
      "content_type": "application/pdf",
      "file_data": "base64-encoded-content",
      "is_included_with_supplier_order": true
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST "https://api.saleskik.com/v1/purchase-orders" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_reference": "Project Alpha",
    "priority_level": "HIGH",
    "line_items": [
      {
        "product_id": "660e8400-e29b-41d4-a716-446655440001",
        "quantity_ordered": 5,
        "unit_price": 1200.00
      }
    ]
  }'
```

**Response:** Returns created purchase order object with `201 Created` status.

### Get Purchase Order Details
Retrieve detailed information for a specific purchase order.

**Endpoint:** `GET /purchase-orders/{id}`

**Path Parameters:**
- `id` (string, required): Purchase order UUID

**Query Parameters:**
- `include` (string): Include related data (`supplier`, `customer`, `line_items`, `attachments`, `audit_trail`, `all`)

**Example Request:**
```bash
curl -X GET "https://api.saleskik.com/v1/purchase-orders/550e8400-e29b-41d4-a716-446655440000?include=all" \
  -H "Authorization: Bearer <token>"
```

### Update Purchase Order
Update an existing purchase order (only allowed for certain statuses).

**Endpoint:** `PUT /purchase-orders/{id}`

**Required Scopes:** `purchase-orders:write`

**Restrictions:**
- Cannot update orders in `COMPLETED`, `CANCELLED`, or `INVOICED` status
- Some fields require specific permissions (e.g., `approval_required`)

**Request Schema:** Same as create, but all fields optional except `id`

### Approve Purchase Order
Approve a purchase order requiring authorization.

**Endpoint:** `POST /purchase-orders/{id}/approve`

**Required Scopes:** `purchase-orders:approve`

**Request Schema:**
```json
{
  "approval_comments": "Approved for urgent project requirement",
  "override_business_rules": false // Optional, requires admin role
}
```

**Response:**
```json
{
  "success": true,
  "purchase_order": { /* Updated purchase order object */ },
  "approval_details": {
    "approved_by": "user-uuid",
    "approved_at": "2024-01-11T14:30:00Z",
    "approval_comments": "Approved for urgent project requirement"
  }
}
```

### Send to Supplier
Send purchase order to supplier with professional email and attachments.

**Endpoint:** `POST /purchase-orders/{id}/send-to-supplier`

**Required Scopes:** `purchase-orders:write`

**Request Schema:**
```json
{
  "include_attachments": true,
  "custom_message": "Please confirm receipt within 24 hours", // Optional
  "urgent_delivery": false,
  "notification_preferences": {
    "send_sms": false,
    "cc_emails": ["manager@company.com"] // Optional
  }
}
```

**Response:**
```json
{
  "success": true,
  "email_sent": true,
  "confirmation_token": "secure-token-123",
  "confirmation_url": "https://api.saleskik.com/supplier/confirm/order-id?token=secure-token-123",
  "attachments_bundled": true,
  "bundle_info": {
    "filename": "PO-2024-001-Attachments.zip",
    "file_count": 3,
    "total_size": "2.4 MB"
  }
}
```

---

## Suppliers

### List Suppliers
Retrieve paginated list of approved suppliers.

**Endpoint:** `GET /suppliers`

**Query Parameters:**
- `page`, `limit` (pagination)
- `is_approved` (boolean): Filter by approval status
- `is_glass_supplier` (boolean): Filter glass specialists
- `search` (string): Search supplier names and codes
- `sort_by` (string): `name`, `performance_rating`, `total_orders`

### Create Supplier
**Endpoint:** `POST /suppliers`

**Request Schema:**
```json
{
  "supplier_name": "New Glass Specialist",
  "supplier_code": "NGS001", // Auto-generated if not provided
  "contact_person": "Sarah Wilson",
  "email_address": "orders@newglass.com.au",
  "phone_number": "+61 3 1234 5678",
  "physical_address": {
    "street": "123 Industrial Drive",
    "city": "Melbourne",
    "state": "VIC",
    "postcode": "3000",
    "country": "Australia"
  },
  "payment_terms": "Net 30",
  "is_local_glass_supplier": true,
  "performance_rating": 5.0
}
```

---

## Approvals

### Get Pending Approvals
Retrieve orders requiring current user's approval.

**Endpoint:** `GET /approvals/pending`

**Response:** Array of purchase orders with approval metadata

### Bulk Approve Orders
Approve multiple orders simultaneously.

**Endpoint:** `POST /approvals/bulk`

**Request Schema:**
```json
{
  "purchase_order_ids": ["uuid1", "uuid2", "uuid3"],
  "approval_comments": "Bulk approval for Q1 orders",
  "individual_comments": {
    "uuid1": "Specific comment for this order"
  }
}
```

---

## Attachments

### Upload Attachment
Upload file attachment to purchase order.

**Endpoint:** `POST /purchase-orders/{id}/attachments`

**Content Type:** `multipart/form-data`

**Form Fields:**
- `file` (file): The file to upload
- `description` (string): File description
- `is_required` (boolean): Whether file is required for order fulfillment
- `include_with_supplier_order` (boolean): Include when sending to supplier

**Example Request:**
```bash
curl -X POST "https://api.saleskik.com/v1/purchase-orders/order-id/attachments" \
  -H "Authorization: Bearer <token>" \
  -F "file=@technical-drawing.pdf" \
  -F "description=Technical specifications and measurements" \
  -F "is_required=true"
```

### Download Attachment
Download a specific attachment with security validation.

**Endpoint:** `GET /purchase-orders/{id}/attachments/{attachment_id}/download`

**Query Parameters:**
- `token` (string): Secure download token (for supplier access)

**Response:** File stream with appropriate content headers

---

## WebSocket API

### Real-Time Updates
Connect to WebSocket for live purchase order updates.

**Endpoint:** `wss://api.saleskik.com/ws/purchase-orders`

**Authentication:** Include Bearer token in connection header or query parameter

**Message Format:**
```json
{
  "type": "PURCHASE_ORDER_CREATED",
  "data": {
    "purchase_order_id": "uuid",
    "purchase_order_number": "PO-2024-001",
    "supplier_name": "Premium Glass Solutions",
    "total_amount": 15750.00,
    "priority": "HIGH"
  },
  "timestamp": "2024-01-11T09:15:30Z",
  "user_id": "uuid"
}
```

**Event Types:**
- `PURCHASE_ORDER_CREATED` - New order created
- `STATUS_CHANGED` - Order status updated
- `APPROVAL_REQUIRED` - Order requires approval
- `SUPPLIER_CONFIRMED` - Supplier confirmed order
- `GOODS_RECEIVED` - Items received and processed
- `INVOICE_CREATED` - Invoice processed and dispatch unblocked

---

## Error Handling

### HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate order number)
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Temporary service unavailability

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more validation errors occurred",
    "details": {
      "field": "supplier_id",
      "message": "Supplier ID is required",
      "provided_value": null
    },
    "request_id": "req_123456789",
    "timestamp": "2024-01-11T09:15:30Z",
    "documentation_url": "https://docs.saleskik.com/api/errors#validation_error"
  }
}
```

### Common Error Codes
- `INVALID_PARAMETER` - Invalid query parameter or request body field
- `VALIDATION_ERROR` - Request validation failed
- `PERMISSION_DENIED` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `BUSINESS_RULE_VIOLATION` - Action violates business rules
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SUPPLIER_TIMEOUT` - Supplier confirmation timeout
- `DISPATCH_BLOCKED` - Order dispatch blocked by business rules

---

## Rate Limiting

API requests are rate limited to ensure fair usage and system stability.

**Limits:**
- **Standard endpoints:** 100 requests per minute per API key
- **Authentication endpoints:** 20 requests per minute per IP
- **File upload endpoints:** 10 requests per minute per API key
- **Bulk operations:** 5 requests per minute per API key

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641899400
X-RateLimit-Window: 60
```

---

## Webhooks

### Configure Webhooks
Register webhook endpoints to receive real-time notifications.

**Endpoint:** `POST /webhooks`

**Request Schema:**
```json
{
  "url": "https://your-app.com/webhooks/purchase-orders",
  "events": [
    "purchase_order.created",
    "purchase_order.approved",
    "purchase_order.completed"
  ],
  "secret": "your-webhook-secret",
  "is_active": true
}
```

**Webhook Payload Example:**
```json
{
  "id": "webhook-delivery-uuid",
  "event": "purchase_order.approved",
  "data": {
    "purchase_order": { /* Full purchase order object */ }
  },
  "timestamp": "2024-01-11T09:15:30Z",
  "api_version": "v1.0"
}
```

---

## Code Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Create purchase order
async function createPurchaseOrder() {
  try {
    const response = await axios.post('https://api.saleskik.com/v1/purchase-orders', {
      supplier_id: '550e8400-e29b-41d4-a716-446655440000',
      priority_level: 'HIGH',
      line_items: [
        {
          product_id: '660e8400-e29b-41d4-a716-446655440001',
          quantity_ordered: 5,
          unit_price: 1200.00
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.SALESKIK_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Purchase order created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating purchase order:', error.response.data);
    throw error;
  }
}

// Search purchase orders
async function searchPurchaseOrders(searchTerm) {
  try {
    const response = await axios.get('https://api.saleskik.com/v1/purchase-orders', {
      params: {
        search: searchTerm,
        status: 'PENDING_APPROVAL',
        limit: 50,
        sort_by: 'created_at',
        sort_direction: 'desc'
      },
      headers: {
        'Authorization': `Bearer ${process.env.SALESKIK_API_TOKEN}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Search error:', error.response.data);
    throw error;
  }
}
```

### Python
```python
import requests
import os

class SalesKikAPI:
    def __init__(self, api_token):
        self.base_url = 'https://api.saleskik.com/v1'
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
    
    def create_purchase_order(self, order_data):
        """Create a new purchase order"""
        response = requests.post(
            f'{self.base_url}/purchase-orders',
            json=order_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_pending_approvals(self):
        """Get orders requiring approval"""
        response = requests.get(
            f'{self.base_url}/approvals/pending',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def approve_order(self, order_id, comments):
        """Approve a purchase order"""
        response = requests.post(
            f'{self.base_url}/purchase-orders/{order_id}/approve',
            json={'approval_comments': comments},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage example
api = SalesKikAPI(os.getenv('SALESKIK_API_TOKEN'))

# Create order
order = api.create_purchase_order({
    'supplier_id': '550e8400-e29b-41d4-a716-446655440000',
    'priority_level': 'URGENT',
    'line_items': [
        {
            'product_id': '660e8400-e29b-41d4-a716-446655440001',
            'quantity_ordered': 10,
            'unit_price': 500.00
        }
    ]
})

print(f"Created order: {order['purchase_order_number']}")
```

### cURL Examples
```bash
# Get all urgent orders
curl -X GET "https://api.saleskik.com/v1/purchase-orders?priority=URGENT" \
  -H "Authorization: Bearer <token>"

# Approve order with comments
curl -X POST "https://api.saleskik.com/v1/purchase-orders/order-id/approve" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"approval_comments": "Approved for critical project"}'

# Search orders by supplier
curl -X GET "https://api.saleskik.com/v1/purchase-orders?search=Premium%20Glass&limit=25" \
  -H "Authorization: Bearer <token>"

# Upload attachment
curl -X POST "https://api.saleskik.com/v1/purchase-orders/order-id/attachments" \
  -H "Authorization: Bearer <token>" \
  -F "file=@drawing.pdf" \
  -F "description=Technical drawing" \
  -F "is_required=true"
```

---

## API Versioning

The API uses semantic versioning with the version specified in the URL path.

**Current Version:** `v1.0`  
**Supported Versions:** `v1.0`  
**Deprecation Policy:** 12 months notice for breaking changes  

**Version Header:**
```http
API-Version: v1.0
```

**Backward Compatibility:**
- New fields may be added to responses without version change
- New optional parameters may be added without version change
- Breaking changes require new version number

---

## SDKs and Integration

### Official SDKs
- **JavaScript/TypeScript:** `npm install @saleskik/purchase-orders-sdk`
- **Python:** `pip install saleskik-purchase-orders`
- **C#/.NET:** `Install-Package SalesKik.PurchaseOrders`
- **PHP:** `composer require saleskik/purchase-orders`

### Postman Collection
Import our comprehensive Postman collection for testing:
**Download:** [SalesKik Purchase Orders API.postman_collection.json](./postman/collection.json)

### OpenAPI Specification
**Download:** [purchase-orders-openapi.yaml](./openapi/purchase-orders-v1.yaml)

---

## Support and Resources

**Documentation:** https://docs.saleskik.com/api/purchase-orders  
**Status Page:** https://status.saleskik.com  
**Developer Portal:** https://developers.saleskik.com  
**Support:** api-support@saleskik.com  

**Community:**
- **GitHub:** https://github.com/saleskik/purchase-orders-api
- **Discord:** https://discord.gg/saleskik-developers
- **Stack Overflow:** Tag questions with `saleskik-api`

---

*Last Updated: January 2024*  
*API Version: v1.0*