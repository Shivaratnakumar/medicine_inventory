# Supply Hub Feature

## Overview

The Supply Hub is a comprehensive feature that allows you to manage supply relationships with other medical stores and track orders, payments, and analytics. As the head of your medical store, you can supply medicines to other stores and monitor all related transactions.

## Features

### 🏪 Supply Store Management
- **Store Relationships**: Create and manage relationships with other medical stores
- **Contact Information**: Store contact details, payment terms, and commission rates
- **Status Tracking**: Monitor active, inactive, pending, and suspended relationships
- **Contract Management**: Set contract start/end dates and terms

### 📦 Order Management
- **Order Creation**: Create supply orders for connected stores
- **Order Tracking**: Monitor order status (pending, confirmed, processing, shipped, delivered, cancelled)
- **Item Management**: Track medicines, quantities, and pricing
- **Commission Calculation**: Automatic commission calculation based on relationship terms

### 💰 Payment Management
- **Payment Tracking**: Record and monitor payments for supply orders
- **Multiple Payment Methods**: Support for cash, card, UPI, bank transfer, and cheque
- **Payment Status**: Track pending, completed, failed, and refunded payments
- **Payment Analytics**: View payment trends and methods

### 📊 Analytics & Reporting
- **Dashboard Overview**: Real-time statistics and key metrics
- **Date Filtering**: Filter data by today, month, or year
- **Sales Trends**: Visual charts showing daily and monthly trends
- **Export Options**: Export data to CSV or PDF formats
- **Store Performance**: Track top-performing supply stores

### 🔐 Role-Based Access Control
- **Admin Access**: Full access to all supply relationships and orders
- **Store Manager Access**: Access only to their own store's supply relationships
- **Secure Data**: Row-level security ensures data privacy

## Database Schema

### Tables Created

1. **supply_relationships**: Manages connections between stores
2. **supply_orders**: Extended orders for supply relationships
3. **supply_order_items**: Items within supply orders
4. **supply_payments**: Payments for supply orders

### Key Features
- UUID primary keys for all tables
- Foreign key relationships with proper constraints
- Row-level security (RLS) policies
- Comprehensive indexing for performance
- Audit trails with created/updated timestamps

## API Endpoints

### Supply Relationships
- `GET /api/supply-relationships` - List all relationships
- `POST /api/supply-relationships` - Create new relationship
- `PUT /api/supply-relationships/:id` - Update relationship
- `DELETE /api/supply-relationships/:id` - Delete relationship
- `GET /api/supply-relationships/stats` - Get relationship statistics

### Supply Orders
- `GET /api/supply-orders` - List all orders
- `POST /api/supply-orders` - Create new order
- `PUT /api/supply-orders/:id` - Update order
- `GET /api/supply-orders/analytics` - Get order analytics

### Supply Payments
- `GET /api/supply-payments` - List all payments
- `POST /api/supply-payments` - Create new payment
- `PUT /api/supply-payments/:id` - Update payment
- `GET /api/supply-payments/analytics` - Get payment analytics

## Setup Instructions

### 1. Database Setup
```bash
# Run the setup script
node setup-supply-hub.js

# Or manually execute the SQL schema
# Copy and paste supply-relationships-schema.sql into Supabase SQL Editor
```

### 2. Server Setup
The API routes are automatically included in the server. No additional configuration needed.

### 3. Frontend Setup
The Supply Hub page is automatically available at `/supply-hub` in your application.

## Usage Guide

### Creating Supply Relationships

1. Navigate to Supply Hub → Supply Stores tab
2. Click "Add New Relationship"
3. Fill in store details:
   - Customer store information
   - Contact person details
   - Contract terms and dates
   - Commission rate
   - Payment terms
4. Save the relationship

### Creating Supply Orders

1. Go to Supply Hub → Orders tab
2. Click "Create New Order"
3. Select the supply relationship
4. Add medicines and quantities
5. Set delivery date and notes
6. Submit the order

### Managing Payments

1. Navigate to Supply Hub → Payments tab
2. View all payments for the selected period
3. Create new payments for orders
4. Update payment status as needed

### Viewing Analytics

1. Go to Supply Hub → Analytics tab
2. Select the time period (today, month, year)
3. View sales trends and performance metrics
4. Export data as needed

## Data Export

### CSV Export
- Click "Export CSV" button
- Downloads filtered data in CSV format
- Includes all order and payment details

### PDF Export
- Click "Export PDF" button
- Generates formatted PDF report
- Includes charts and summary statistics

## Security Features

### Row-Level Security (RLS)
- Users can only access data for their own stores
- Admin users have full access
- Automatic filtering based on user permissions

### Data Validation
- Input validation on all API endpoints
- Proper error handling and messages
- SQL injection protection

### Audit Trails
- Created and updated timestamps
- User tracking for all changes
- Complete change history

## Customization

### Adding New Payment Methods
1. Update the payment method enum in the database
2. Add validation in the API endpoints
3. Update the frontend dropdown options

### Modifying Commission Structure
1. Update the commission calculation logic in the API
2. Modify the database schema if needed
3. Update the frontend display

### Adding New Order Statuses
1. Update the order status enum in the database
2. Add new status options in the frontend
3. Update status icons and colors

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Ensure user has proper role assigned
   - Check RLS policies are correctly applied

2. **Data Not Loading**
   - Verify database tables are created
   - Check API endpoints are accessible
   - Review browser console for errors

3. **Export Not Working**
   - Ensure browser allows file downloads
   - Check data is available for the selected period

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Future Enhancements

- Real-time notifications for new orders
- Mobile app integration
- Advanced reporting and analytics
- Integration with external payment gateways
- Automated invoice generation
- Inventory synchronization
- Multi-currency support

## Support

For issues or questions regarding the Supply Hub feature:
1. Check the troubleshooting section
2. Review the API documentation
3. Contact the development team

---

**Note**: This feature requires proper database setup and user authentication. Ensure all prerequisites are met before using the Supply Hub functionality.


