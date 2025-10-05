# Medicine Inventory Management System

A comprehensive medicine inventory management system built with React.js, Node.js, Express, and Supabase. This system provides complete inventory management, analytics, multi-store support, and more.

## Features

### 🔐 Authentication & Authorization
- Admin and User login system
- JWT-based authentication
- Role-based access control
- Password reset functionality

### 📊 Smart Analytics Dashboard
- Real-time inventory statistics
- Sales analytics with charts
- Revenue tracking
- Category distribution
- Stock status overview

### 💊 Medicine Management
- Add, edit, delete medicines
- Search and filter medicines
- Batch number tracking
- Expiry date monitoring
- Prescription requirement flags
- Barcode support

### 📦 Order Management
- Create and manage orders
- Order status tracking
- Customer information management
- Order history

### 💰 Billing System
- Invoice generation
- Payment tracking
- Tax and discount calculations
- Payment status management

### 🏪 Multi-Store Management
- Multiple store support
- Store-specific inventory
- Store manager assignment
- Cross-store analytics

### ⚠️ Alerts & Notifications
- Low stock alerts
- Expiry date warnings
- Real-time notifications
- Email notifications

### 📱 Additional Features
- Feedback system
- Customer support tickets
- Payment processing (Stripe integration)
- User profile management
- Responsive design

## Tech Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - Database and authentication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Database
- **PostgreSQL** (via Supabase)
- **Row Level Security (RLS)**
- **Real-time subscriptions**

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Git

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd medicine-inventory-management
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy the database schema from `database/schema.sql` and run it in the Supabase SQL editor

### 4. Environment Configuration

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Payment Configuration (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Run the application

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:

# Start backend only
npm run server

# Start frontend only
npm run client
```

## Default Login Credentials

- **Admin**: admin@medicineinventory.com / admin123
- **User**: user@example.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Medicines
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `GET /api/medicines/search` - Search medicines
- `GET /api/medicines/low-stock` - Get low stock medicines
- `GET /api/medicines/expiring` - Get expiring medicines

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

### Analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/inventory` - Inventory analytics
- `GET /api/analytics/expiry` - Expiry analytics
- `GET /api/analytics/low-stock` - Low stock analytics

### Other endpoints for billing, stores, notifications, feedback, support, payments, and profile are also available.

## Database Schema

The database includes the following main tables:
- `users` - User accounts and authentication
- `stores` - Store locations and management
- `medicines` - Medicine inventory
- `categories` - Medicine categories
- `store_inventory` - Store-specific inventory
- `orders` - Customer orders
- `order_items` - Order line items
- `billing` - Invoices and billing
- `payments` - Payment records
- `notifications` - System notifications
- `feedback` - Customer feedback
- `support_tickets` - Support requests
- `audit_logs` - System audit trail

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Rate limiting
- Security headers with Helmet
- Row-level security in Supabase

## Testing

The application includes comprehensive testing setup:

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## Deployment

### Frontend (Vercel/Netlify)
1. Build the React app: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Set environment variables

### Backend (Railway/Heroku)
1. Deploy the `server` folder
2. Set all environment variables
3. Ensure database is accessible

### Database
- Use Supabase production instance
- Configure RLS policies
- Set up backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@medicineinventory.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Barcode scanning
- [ ] Integration with external APIs
- [ ] Machine learning for demand forecasting
- [ ] Multi-language support
- [ ] Advanced user roles and permissions
