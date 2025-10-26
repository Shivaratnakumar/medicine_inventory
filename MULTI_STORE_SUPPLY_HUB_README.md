# Multi-Store Supply Hub Implementation

## Overview

The Supply Hub has been enhanced to support multiple stores instead of being limited to a single store. This allows users to manage supply relationships, orders, and analytics across multiple store locations.

## Key Features

### 🏪 Multi-Store Support
- **Store Selection**: Dropdown to select specific stores or view all stores
- **Store Context**: Centralized store management across the application
- **Persistent Selection**: Store selection is saved in localStorage
- **Store-Specific Data**: All data is filtered based on selected store

### 📊 Enhanced Analytics
- **Store-Specific Metrics**: Analytics show data for selected store only
- **Cross-Store Comparison**: Ability to view data across all stores
- **Dynamic Filtering**: Real-time data updates when store selection changes

### 🔧 Technical Implementation

#### Frontend Changes

1. **StoreContext** (`client/src/contexts/StoreContext.js`)
   - Centralized store management
   - Store selection persistence
   - Store data loading and caching

2. **StoreSelector Component** (`client/src/components/StoreSelector.js`)
   - Reusable store selection dropdown
   - Consistent UI across the application

3. **SupplyHub Updates** (`client/src/pages/SupplyHub/SupplyHub.js`)
   - Integration with StoreContext
   - Store-specific data filtering
   - Enhanced UI with store information

#### Backend Changes

1. **API Enhancements**
   - All supply-related APIs now support `store_id` parameter
   - `store_id=all` shows data for all stores
   - `store_id=specific-id` shows data for specific store

2. **Updated Routes**
   - `supply-orders.js`: Store filtering for orders
   - `supply-payments.js`: Store filtering for payments
   - `supply-relationships.js`: Store filtering for relationships

## Usage

### Store Selection
1. Navigate to Supply Hub
2. Use the store dropdown in the top-left corner
3. Select "All Stores" to view aggregated data
4. Select a specific store to view store-specific data

### Data Filtering
- **Orders**: Shows orders where the selected store is either supplier or customer
- **Payments**: Shows payments related to orders involving the selected store
- **Relationships**: Shows supply relationships involving the selected store
- **Analytics**: All metrics are calculated based on selected store

### Store Context Usage
```javascript
import { useStore } from '../contexts/StoreContext';

const MyComponent = () => {
  const { 
    selectedStoreId, 
    availableStores, 
    selectStore, 
    getSelectedStore 
  } = useStore();
  
  // Use store context functions
};
```

## API Parameters

### Store Filtering
All supply-related APIs now accept a `store_id` parameter:

- `store_id=all` (default): Returns data for all stores
- `store_id=<uuid>`: Returns data for specific store only

### Example API Calls
```javascript
// Get orders for all stores
GET /api/supply-orders

// Get orders for specific store
GET /api/supply-orders?store_id=123e4567-e89b-12d3-a456-426614174000

// Get analytics for specific store
GET /api/supply-orders/analytics?store_id=123e4567-e89b-12d3-a456-426614174000&period=month
```

## Database Schema

The existing database schema supports multi-store functionality:

- `stores` table: Contains store information
- `supply_relationships` table: Links stores as suppliers/customers
- `supply_orders` table: Contains `supplier_store_id` and `customer_store_id`
- `supply_payments` table: Linked to orders, inherits store context

## Benefits

1. **Scalability**: Support for multiple store locations
2. **Flexibility**: Easy switching between store views
3. **Data Isolation**: Store-specific data filtering
4. **User Experience**: Intuitive store selection interface
5. **Performance**: Efficient data loading with proper filtering

## Future Enhancements

1. **Store Comparison**: Side-by-side comparison of multiple stores
2. **Store Hierarchy**: Support for parent-child store relationships
3. **Store Permissions**: Role-based access to specific stores
4. **Store Analytics**: Advanced analytics comparing store performance
5. **Bulk Operations**: Operations across multiple stores

## Migration Notes

- Existing single-store functionality remains unchanged
- Default behavior shows "All Stores" when no specific store is selected
- No database migration required
- Backward compatible with existing API calls

## Testing

The multi-store functionality can be tested by:

1. Creating multiple stores in the system
2. Setting up supply relationships between stores
3. Creating orders and payments
4. Switching between store selections in the Supply Hub
5. Verifying data filtering works correctly

## Troubleshooting

### Common Issues

1. **Store not loading**: Check if stores exist in the database
2. **Data not filtering**: Verify `store_id` parameter is being passed correctly
3. **Context errors**: Ensure StoreProvider wraps the application
4. **Selection not persisting**: Check localStorage is enabled

### Debug Steps

1. Check browser console for errors
2. Verify API responses include store filtering
3. Check StoreContext state in React DevTools
4. Verify database has proper store data




