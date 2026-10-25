# Phin & Bean - Thương mại điện tử cà phê

## Cấu trúc project

```
frontend/
  src/
    components/          # UI components (shadcn/ui)
    pages/               # Page components (customer, admin)
    api/                 # Axios client
    stores/              # Zustand stores (cart, auth)
    hooks/               # Custom hooks
    lib/                 # Helpers (format, constants, utils)
    types/               # Shared TypeScript types
    styles/              # Tailwind CSS
    main.tsx             # Entry point
  
backend/
  app/                   # FastAPI app
  alembic/               # Database migrations
  requirements.txt       # Python dependencies
  .env.example          # Environment variables template
  main.py                # FastAPI application
  
README.md               # Documentation
```

## Cài đặt

### Backend (Python 3.11+)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (React 18 + Vite)
```bash
cd frontend
npm install
npm run dev
```

## Cấu hình

- **Database**: SQLite (dev) - dễ dàng đổi sang MySQL bằng `DATABASE_URL`
- **CORS**: Chỉ cho phép origin của frontend (`http://localhost:5173`)
- **JWT**: Secret key trong `.env` - thay đổi ở production
- **Auth**: Frontend kiểm tra role=admin với `require_admin` dependency
- **Chatbot**: Google Gemini API - key từ `.env` (mock khi chưa có)
- **Payment**: 3 phương thức - COD, thẻ giả lập, VietQR giả lập

## Giai đoạn 1 (đã hoàn thành)
- Backend: config, models, routes (health), API, DB setup
- Frontend: structure, types, constants, stores, components, API client
- README với hướng dẫn chạy

## Giai đoạn 2 (tiếp theo)
- Auth (registration, login, JWT)
- Seed data (admin, customers, products, orders)
- Cart & Order flow
- Admin dashboard
- AI Chatbot
- UI polish (responsive, animations, accessibility)
