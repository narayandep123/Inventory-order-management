# Production-Ready Inventory & Order Management System

This project is a full-stack, containerized system with:

- React frontend (responsive UI)
- FastAPI backend (validated business logic)
- PostgreSQL database
- Docker + Docker Compose orchestration

## Project Structure

```text
.
├── backend
│   ├── app
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Implemented API Endpoints

### Product Management

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`

### Customer Management

- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `DELETE /customers/{id}`

### Order Management

- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `DELETE /orders/{id}`

### Dashboard

- `GET /dashboard/summary`

## Business Rules Covered

- Unique product SKU
- Unique customer email
- Non-negative product stock
- No orders with insufficient inventory
- Automatic stock reduction when order is created
- Automatic total order amount calculation in backend
- API validation + proper HTTP status codes + error handling

## Local Run With Docker Compose

1. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Build and start containers:

```bash
docker compose up --build
```

3. Open apps:

- Frontend: `http://localhost`
- Backend API docs: `http://localhost:8000/docs`

## Deployment Plan (Free Platforms)

### Backend (Render, Railway, or Fly.io)

- Deploy from `backend` directory using Dockerfile.
- Set environment variables:
  - `DATABASE_URL`
  - `FRONTEND_ORIGIN`
  - `LOW_STOCK_THRESHOLD`
- Use managed PostgreSQL from hosting provider.

### Frontend (Vercel or Netlify)

- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_URL` to deployed backend URL.

## Submission Checklist

- GitHub repository link (frontend + backend)
- Docker Hub backend image link
- Live frontend URL
- Live backend API URL
- Screenshots:
  - Dashboard
  - Product management
  - Customer management
  - Order creation/details
