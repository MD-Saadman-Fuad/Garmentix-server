# Garmentix Server

Backend API server for Garmentix - A modern e-commerce platform for garments.

## 🚀 Live API

**Base URL:** https://garmentix-server.onrender.com

## 📋 Features

- **Product Management** - CRUD operations for products
- **Order Management** - Handle customer orders and status tracking
- **User Management** - User registration and profile management
- **Firebase Authentication** - Secure authentication using Firebase Admin SDK
- **MongoDB Database** - Efficient data storage and retrieval

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Firebase Admin SDK** - Authentication and user management
- **CORS** - Cross-origin resource sharing
- **Cookie Parser** - HTTP cookie parsing

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/MD-Saadman-Fuad/Garmentix-server.git
cd Garmentix-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:5173

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
```

4. Start the development server:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

## 🔌 API Endpoints

### Products
- `GET /products` - Get all products (optional query: `?email=user@example.com`)
- `GET /products/featured` - Get featured products (limited to 6)
- `GET /products/:id` - Get product by ID
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Orders
- `GET /orders` - Get all orders (optional queries: `?email=user@example.com&status=pending`)
- `POST /orders` - Create new order
- `PATCH /orders/:id` - Update order status
- `DELETE /orders/:id` - Delete order

### Users
- `GET /users` - Get all users
- `GET /users/:email` - Get user by email
- `POST /users` - Create new user
- `PUT /users/:email` - Update user
- `DELETE /users/:email` - Delete user

### Authentication
- `POST /auth/login` - Login with Firebase token
  ```json
  {
    "idToken": "firebase_id_token"
  }
  ```
- `GET /auth/verify` - Verify authentication (requires Authorization header or cookie)
- `POST /auth/logout` - Logout and clear authentication cookie

## 🔐 Authentication

The API uses Firebase Authentication. Protected routes require either:
- **Authorization Header**: `Bearer <firebase_token>`
- **Cookie**: `firebaseToken` (set automatically on login)

### Using the `verifyFBToken` Middleware

For protected routes, add the middleware:
```javascript
app.get('/protected-route', verifyFBToken, async (req, res) => {
    // Access user info via req.user
    console.log(req.user.email);
});
```

## 🌐 CORS Configuration

The server accepts requests from:
- Production: `https://garmentix.netlify.app`
- Development: `http://localhost:5173`

Configure via `CLIENT_URL` environment variable.

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `URI` | MongoDB connection string | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |
| `CLIENT_URL` | Frontend URL for CORS | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | ✅ |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | ✅ |

## 🚢 Deployment

### Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Add environment variables in Render dashboard
6. Deploy!

## 📄 License

ISC

## 👤 Author

**MD Saadman Fuad**
- GitHub: [@MD-Saadman-Fuad](https://github.com/MD-Saadman-Fuad)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Made with ❤️ for Garmentix
