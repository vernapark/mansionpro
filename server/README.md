# SMS Varanasi Payment System - Backend Server

Real-time payment management system with WebSocket (Socket.IO) support for live updates.

## 🚀 Features

- ✅ Real-time WebSocket connection with Socket.IO
- ✅ Live dashboard updates for admins
- ✅ Transaction tracking and monitoring
- ✅ Student login tracking
- ✅ Payment status notifications
- ✅ System activity logs
- ✅ RESTful API endpoints
- ✅ CORS enabled for cross-origin requests
- ✅ Graceful error handling

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup Steps

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## 🌐 Server URLs

- **Main Application:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Health Check:** http://localhost:3000/api/health
- **WebSocket:** ws://localhost:3000

## 📡 API Endpoints

### Public Endpoints

#### `GET /api/health`
Check server health status
```json
{
  "status": "running",
  "uptime": 123.45,
  "activeConnections": 2,
  "timestamp": "2025-12-18T04:00:00.000Z"
}
```

#### `GET /api/stats`
Get current system statistics
```json
{
  "totalTransactions": 10,
  "totalRevenue": 824500,
  "activeStudents": 266,
  "pendingPayments": 2
}
```

#### `GET /api/transactions`
Get all transactions
```json
{
  "total": 10,
  "transactions": [...]
}
```

### Student Actions

#### `POST /api/student/login`
Record student login
```json
{
  "rollNumber": "MBA/23/001",
  "name": "John Doe",
  "course": "MBA",
  "semester": "3rd Semester"
}
```

### Payment Actions

#### `POST /api/payment/initiate`
Record payment initiation
```json
{
  "rollNumber": "MBA/23/001",
  "studentName": "John Doe",
  "amount": 82450,
  "paymentMethod": "Credit Card"
}
```

#### `POST /api/payment/complete`
Record successful payment
```json
{
  "rollNumber": "MBA/23/001",
  "studentName": "John Doe",
  "amount": 82450,
  "paymentMethod": "Credit Card",
  "cardType": "Visa",
  "transactionId": "TXN1234567890"
}
```

#### `POST /api/payment/failed`
Record failed payment
```json
{
  "rollNumber": "MBA/23/001",
  "studentName": "John Doe",
  "amount": 82450,
  "reason": "Insufficient funds"
}
```

## 🔌 WebSocket Events

### Server → Client Events

- `statsUpdate` - Real-time stats update
- `newTransaction` - New transaction added
- `paymentInitiated` - Payment process started
- `paymentCompleted` - Payment successful
- `paymentFailed` - Payment failed
- `studentLogin` - Student logged in
- `connectionUpdate` - Connection count updated

### Client → Server Events

- `requestStats` - Request current stats
- `requestTransactions` - Request transaction list

## 🔐 Admin Credentials

**Default credentials (Change in production!):**
- Username: `admin`
- Password: `admin123`

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **WebSocket:** Socket.IO
- **CORS:** cors middleware
- **Environment:** dotenv

## 📊 Admin Panel Features

1. **Real-time Dashboard**
   - Live transaction monitoring
   - Revenue tracking
   - Active student count
   - Pending payments counter

2. **Transaction Feed**
   - Recent transactions (last 10)
   - Status indicators (completed/pending/failed)
   - Real-time updates

3. **System Activity Logs**
   - Student logins
   - Payment events
   - System notifications
   - Connection status

4. **Connection Status**
   - WebSocket connection indicator
   - Live/offline status
   - Auto-reconnection

## 🔄 Real-time Updates

The system uses Socket.IO for bi-directional real-time communication:

1. **Admin connects** → Receives current stats and recent transactions
2. **Student logs in** → All admins notified instantly
3. **Payment initiated** → Pending count updates across all admin panels
4. **Payment completed** → Transaction appears in all admin feeds
5. **Payment failed** → All admins receive failure notification

## 📝 Development

### Run in development mode with nodemon:
```bash
npm run dev
```

This will auto-restart the server on file changes.

## 🚀 Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Change default admin credentials
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Use a process manager (PM2, forever)
6. Set up reverse proxy (Nginx)

## 🐛 Error Handling

The server includes comprehensive error handling:
- Uncaught exceptions
- Unhandled promise rejections
- Graceful shutdown on SIGTERM/SIGINT
- Socket connection error recovery

## 📈 Future Enhancements

- [ ] Database integration (MySQL/PostgreSQL)
- [ ] JWT authentication for API
- [ ] Real payment gateway integration
- [ ] Email notifications
- [ ] Receipt generation (PDF)
- [ ] Advanced analytics
- [ ] User role management
- [ ] Audit logging

## 📞 Support

For issues or questions, contact the development team.

---

**SMS Varanasi Payment System v1.0.0**
