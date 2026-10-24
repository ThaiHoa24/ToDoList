# 📝 ToDo List - Fullstack Project

Dự án ToDo List fullstack gồm Frontend (**Next.js**) và Backend (**NestJS**) được tổ chức chung trong một monorepo gọn gàng, tách biệt rõ ràng giữa hai phần.

---

## 📁 Cấu trúc thư mục (Project Structure)

```text
ToDoList/
├── backend/            # 🚀 NestJS Backend API (Prisma, PostgreSQL, JWT Auth,...)
│   ├── prisma/         # Prisma schema & migrations
│   ├── src/            # Mã nguồn backend (Controllers, Modules, Services, DTOs)
│   ├── test/           # Unit & e2e test
│   ├── .env.example    # Mẫu biến môi trường backend
│   └── package.json
│
├── frontend/           # 💻 Next.js Frontend (React 19, Tailwind CSS, App Router)
│   ├── public/         # Static assets
│   ├── src/            # Mã nguồn frontend (App Router, Components, Hooks)
│   ├── .env.example    # Mẫu biến môi trường frontend
│   └── package.json
│
├── docs/               # 📄 Tài liệu đặc tả và hướng dẫn dự án (.docx)
│   ├── ToDo_List_Backend_Handoff_Specification.docx
│   └── ToDo_List_FE_Guide_v2.docx
│
├── .gitignore          # Quy tắc ignore chung cho toàn bộ dự án
├── package.json        # Quản lý script khởi chạy tập trung từ thư mục gốc
└── README.md           # Tài liệu hướng dẫn dự án
```

---

## ⚙️ Cấu hình Môi trường (.env)

### 1. Backend (`backend/.env`)
Tạo file `backend/.env` (tham khảo `backend/.env.example`):
```env
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/todo_list_db?schema=public"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"
```
> **Lưu ý về Port:** Mặc định Next.js chạy trên cổng `3000`. Nên đặt Backend chạy ở cổng `3001` (hoặc cổng khác `3000`) để tránh xung đột cổng khi chạy song song cả hai.

### 2. Frontend (`frontend/.env.local`)
Tạo file `frontend/.env.local`:
```env
# URL trỏ đến backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án

### Cài đặt thư viện (Dependencies)
Mở terminal tại thư mục gốc và cài đặt cho từng bên:
```bash
# Cài đặt backend
cd backend
npm install

# Cài đặt frontend
cd ../frontend
npm install
```

### Chạy dự án từ thư mục gốc (Root scripts)
Bạn có thể chạy trực tiếp từ thư mục gốc mà không cần phải `cd` vào từng thư mục:

| Lệnh | Chức năng |
|---|---|
| `npm run dev` | Khởi chạy đồng thời cả Backend và Frontend |
| `npm run dev:be` | Khởi chạy riêng Backend (chế độ watch) |
| `npm run dev:fe` | Khởi chạy riêng Frontend |
| `npm run build` | Build production cho cả Backend và Frontend |
| `npm run lint` | Chạy linter cho cả 2 dự án |

---

## 🗄️ Cơ sở dữ liệu (Prisma & PostgreSQL)
Để khởi tạo hoặc cập nhật Database:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```
