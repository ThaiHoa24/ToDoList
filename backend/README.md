# 🛠️ TO-DO LIST API BACKEND (NestJS + Prisma + PostgreSQL)

> **Tài liệu Kỹ thuật & Hướng dẫn Triển khai Backend**  
> **Phiên bản:** 2.0 | **Cập nhật:** 10/2026  
> **Nền tảng:** NestJS 12.x + Prisma ORM 7.x + PostgreSQL  
> **Kiến trúc:** Controller $\rightarrow$ Service $\rightarrow$ Repository / Prisma $\rightarrow$ PostgreSQL

---

## 📑 Mục lục
1. [Giới thiệu & Phạm vi Backend](#1-giới-thiệu--phạm-vi-backend)
2. [Thiết kế Cơ sở Dữ liệu (Prisma & PostgreSQL)](#2-thiết-kế-cơ-sở-dữ-liệu-prisma--postgresql)
3. [Quy tắc Nghiệp vụ bắt buộc (Business Rules)](#3-quy-tắc-nghiệp-vụ-bắt-buộc-business-rules)
4. [Đặc tả API Contract & DTOs](#4-đặc-tả-api-contract--dtos)
5. [Cấu trúc Thư mục Mã nguồn (Project Structure)](#5-cấu-trúc-thư-mục-mã-nguồn-project-structure)
6. [Hướng dẫn Cài đặt & Khởi chạy (Local Setup)](#6-hướng-dẫn-cài-đặt--khởi-chạy-local-setup)
7. [Checklist Kiểm thử Backend (Testing & QA)](#7-checklist-kiểm-thử-backend-testing--qa)
8. [Lộ trình Triển khai từng bước (Sprint Roadmap)](#8-lộ-trình-triển-khai-từng-bước-sprint-roadmap)
9. [Những điểm kỹ thuật cần lưu ý & Chốt](#9-những-điểm-kỹ-thuật-cần-lưu-ý--chốt)

---

## 1. Giới thiệu & Phạm vi Backend

Đây là dịch vụ Backend cung cấp toàn bộ RESTful API cho hệ thống quản lý công việc (To-Do List / Kanban). 

### 1.1. Phạm vi tính năng MVP
- **Auth:** Đăng ký, đăng nhập, đăng xuất, lấy thông tin tài khoản qua JWT Session.
- **Tasks CRUD:** Quản lý công việc với 4 trạng thái (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), độ ưu tiên, danh mục và hạn chót.
- **Categories CRUD:** Phân loại công việc theo danh mục màu sắc và icon.
- **Bộ lọc & Sắp xếp:** Tìm kiếm từ khóa, lọc theo trạng thái/ưu tiên/view (overdue, today), sắp xếp đa tiêu chí và phân trang.
- **Bảo mật Multi-tenant:** Cách ly dữ liệu hoàn toàn giữa các người dùng; User A tuyệt đối không xem hoặc can thiệp được dữ liệu của User B.

### 1.2. Ngoài phạm vi MVP (Dành cho Phase sau)
- Chưa làm: Subtasks, nhắc nhở (Reminders), công việc lặp lại (Recurring tasks), upload tệp tin, Websocket realtime, thông báo push.

---

## 2. Thiết kế Cơ sở Dữ liệu (Prisma & PostgreSQL)

### 2.1. Mô hình Quan hệ (ERD)

```mermaid
erDiagram
    users ||--o{ tasks : "1-N (onDelete: Cascade)"
    users ||--o{ categories : "1-N (onDelete: Cascade)"
    categories ||--o{ tasks : "0..1-N (onDelete: SetNull)"

    users {
        int id PK "autoincrement"
        varchar name "100"
        varchar email UK "255"
        varchar password_hash "255"
        timestamptz created_at
        timestamptz updated_at
    }

    categories {
        int id PK "autoincrement"
        int user_id FK "Cascade"
        varchar name "100"
        varchar color "20, nullable"
        varchar icon "50, nullable"
        timestamptz created_at
        timestamptz updated_at
    }

    tasks {
        int id PK "autoincrement"
        int user_id FK "Cascade"
        int category_id FK "SetNull, nullable"
        varchar title "255"
        text notes "nullable"
        task_status status "TODO | IN_PROGRESS | REVIEW | DONE"
        task_priority priority "LOW | MEDIUM | HIGH"
        timestamptz deadline "nullable"
        timestamptz completed_at "nullable"
        timestamptz created_at
        timestamptz updated_at
    }
```

### 2.2. Prisma Schema chuẩn (`prisma/schema.prisma`)

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "esm"
}

datasource db {
  provider = "postgresql"
}

enum task_status {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum task_priority {
  LOW
  MEDIUM
  HIGH
}

model users {
  id            Int          @id @default(autoincrement())
  name          String       @db.VarChar(100)
  email         String       @unique @db.VarChar(255)
  password_hash String       @db.VarChar(255)
  created_at    DateTime     @default(now()) @db.Timestamptz(6)
  updated_at    DateTime     @default(now()) @db.Timestamptz(6)
  categories    categories[]
  tasks         tasks[]
}

model categories {
  id         Int      @id @default(autoincrement())
  user_id    Int
  name       String   @db.VarChar(100)
  color      String?  @db.VarChar(20)
  icon       String?  @db.VarChar(50)
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  users users   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  tasks tasks[]

  @@unique([user_id, name], map: "uq_categories_user_name")
}

model tasks {
  id           Int           @id @default(autoincrement())
  user_id      Int
  category_id  Int?
  title        String        @db.VarChar(255)
  notes        String?       @db.Text
  status       task_status   @default(TODO)
  priority     task_priority @default(MEDIUM)
  deadline     DateTime?     @db.Timestamptz(6)
  completed_at DateTime?     @db.Timestamptz(6)
  created_at   DateTime      @default(now()) @db.Timestamptz(6)
  updated_at   DateTime      @default(now()) @db.Timestamptz(6)

  users      users       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  categories categories? @relation(fields: [category_id], references: [id], onDelete: SetNull)

  @@index([user_id, status], map: "idx_tasks_user_status")
  @@index([user_id, deadline], map: "idx_tasks_user_deadline")
  @@index([category_id], map: "idx_tasks_category")
}
```

---

## 3. Quy tắc Nghiệp vụ bắt buộc (Business Rules)

Backend Developer cần lưu ý cài đặt chính xác các quy tắc nghiệp vụ sau trong tầng Service:

### 3.1. Phân quyền & Tenant Isolation (Tối quan trọng)
- **Tuyệt đối không lấy `userId` từ body hoặc query params của client.**
- `userId` chỉ được lấy từ JWT Token đã qua xác thực tại `JwtAuthGuard` (thông qua decorator `@CurrentUser('id')`).
- Mọi truy vấn `SELECT`, `UPDATE`, `DELETE` trên bảng `tasks` và `categories` **bắt buộc** phải có điều kiện: `where: { id, user_id: currentUserId }`.
- Nếu bản ghi không tồn tại **HOẶC** không thuộc sở hữu của user hiện tại, service **phải ném ra `NotFoundException` (HTTP 404)**. Tuyệt đối không trả về 403 để tránh rò rỉ sự tồn tại của ID dữ liệu.

### 3.2. Lifecycle của Task & Quản lý `completed_at`
- Enum `task_status` gồm: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- **Chuyển sang `DONE`**: Khi `status` chuyển từ bất kỳ giá trị nào khác sang `DONE`, cập nhật `completed_at = new Date()` (UTC).
- **Rời khỏi `DONE`**: Khi `status` chuyển từ `DONE` sang bất kỳ trạng thái nào khác (`TODO`, `IN_PROGRESS`, `REVIEW`), đặt `completed_at = null`.
- Khi cập nhật các trường khác (như `title`, `notes`, `priority`...) mà `status` không đổi thì **giữ nguyên giá trị `completed_at` hiện tại**.

### 3.3. Ràng buộc Dữ liệu & Category Ownership
- `title`: Bắt buộc, chuỗi từ 1 đến 255 ký tự sau khi `trim()`. Từ chối chuỗi chỉ chứa khoảng trắng.
- `notes`: Tùy chọn, tối đa 5000 ký tự.
- `priority`: Mặc định `MEDIUM`. Giá trị hợp lệ: `LOW`, `MEDIUM`, `HIGH`.
- Khi tạo hoặc cập nhật Task có `category_id`: Bắt buộc kiểm tra `category_id` đó có tồn tại và thuộc sở hữu của `currentUserId` hay không. Nếu không hợp lệ $\rightarrow$ Ném `BadRequestException` hoặc `NotFoundException`.
- Khi xóa Category (`DELETE /api/categories/:id`): Chỉ xóa bản ghi category; các task đang trỏ tới category này sẽ tự động được set `category_id = null` nhờ `onDelete: SetNull`.

### 3.4. Logic Hạn chót (Deadline) & Quá hạn (Overdue)
- `deadline` lưu trữ theo định dạng UTC (`timestamptz`).
- **Nghiệp vụ Overdue:**
  $$\text{status} \neq \text{'DONE'} \quad \text{AND} \quad \text{deadline IS NOT NULL} \quad \text{AND} \quad \text{deadline} < \text{NOW()}$$
- **Nghiệp vụ Due Today (`view = today`):** Tính toán khoảng bắt đầu ngày (`00:00:00`) và kết thúc ngày (`23:59:59.999`) dựa theo múi giờ người dùng (mặc định cấu hình server/user), sau đó quy đổi về UTC để so khớp trong DB.

---

## 4. Đặc tả API Contract & DTOs

**Base URL:** `/api`

### 4.1. Chuẩn Hóa Phản Hồi (Response Wrapping)

Toàn bộ Controller đều được intercept bởi `ResponseInterceptor` và `HttpExceptionFilter`:

- **Thành công (200 / 201):**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-21T14:30:00.000Z"
}
```
- **Thành công cho Danh sách có phân trang:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "timestamp": "2026-10-21T14:30:00.000Z"
}
```
- **Thất bại (4xx / 5xx):**
```json
{
  "statusCode": 400,
  "timestamp": "2026-10-21T14:30:00.000Z",
  "path": "/api/tasks",
  "error": {
    "message": ["title should not be empty"],
    "error": "Bad Request"
  }
}
```

---

### 4.2. Chi tiết Endpoints & DTOs

#### A. Auth Module (`/api/auth`)

1. **`POST /api/auth/register`**
   - **Body (`RegisterDto`):**
     - `name`: String, 1–100 ký tự.
     - `email`: String, định dạng email hợp lệ.
     - `password`: String, tối thiểu 6 ký tự.
   - **Xử lý:** Kiểm tra trùng email $\rightarrow$ Hash password bằng `bcrypt` (salt rounds: 10) $\rightarrow$ Tạo user $\rightarrow$ Trả về thông tin user (loại bỏ `password_hash`).
   - **Status:** `201 Created` (trùng email $\rightarrow$ `409 Conflict`).

2. **`POST /api/auth/login`**
   - **Body (`LoginDto`):** `{ email, password }`
   - **Xử lý:** Kiểm tra user, đối chiếu hash. Ký JWT Access Token.
   - **Cookie / Header:** Set `httpOnly` cookie chứa access token (hoặc trả về trong `data.accessToken`).
   - **Status:** `200 OK` (sai email/mật khẩu $\rightarrow$ `401 Unauthorized`).

3. **`POST /api/auth/logout`**
   - **Xử lý:** Xóa cookie phiên làm việc.
   - **Status:** `200 OK`.

4. **`GET /api/auth/me`** (Protected)
   - **Xử lý:** Trả về thông tin public của user từ payload JWT (`id`, `name`, `email`, `created_at`).
   - **Status:** `200 OK` / `401 Unauthorized`.

---

#### B. Tasks Module (`/api/tasks`) - Tất cả đều yêu cầu Guard

1. **`GET /api/tasks`**
   - **Query Params (`QueryTaskDto`):**
     - `status` *(optional)*: `TODO` | `IN_PROGRESS` | `REVIEW` | `DONE` | `all` (mặc định: `all`).
     - `search` *(optional)*: String (tìm kiếm `contains`, case-insensitive trên `title` và `notes`).
     - `categoryId` *(optional)*: Int (lọc theo danh mục).
     - `priority` *(optional)*: `LOW` | `MEDIUM` | `HIGH`.
     - `view` *(optional)*: `today` | `upcoming` | `overdue`.
     - `sort` *(optional)*: `createdAt` | `deadline` | `priority` | `title` (mặc định: `createdAt`).
     - `order` *(optional)*: `asc` | `desc` (mặc định: `desc`).
     - `page` *(optional)*: Int $\ge 1$ (mặc định: 1).
     - `limit` *(optional)*: Int từ 1 đến 100 (mặc định: 20).
   - **Xử lý:** Xây dựng mệnh đề `where` của Prisma kết hợp với `user_id = currentUser.id`. Tính `skip = (page - 1) * limit`.

2. **`POST /api/tasks`**
   - **Body (`CreateTaskDto`):**
     ```typescript
     export class CreateTaskDto {
       @IsNotEmpty()
       @IsString()
       @MaxLength(255)
       title: string;

       @IsOptional()
       @IsString()
       @MaxLength(5000)
       notes?: string;

       @IsOptional()
       @IsEnum(task_status)
       status?: task_status;

       @IsOptional()
       @IsEnum(task_priority)
       priority?: task_priority;

       @IsOptional()
       @IsInt()
       categoryId?: number;

       @IsOptional()
       @IsISO8601()
       deadline?: string;
     }
     ```
   - **Xử lý:** Tự động set `user_id = currentUser.id`. Nếu `status === 'DONE'`, set `completed_at = now()`.

3. **`GET /api/tasks/:id`**
   - **Param:** `id` (ParseIntPipe).
   - **Xử lý:** `prisma.tasks.findFirst({ where: { id, user_id } })`. Nếu không thấy $\rightarrow$ `NotFoundException`.

4. **`PATCH /api/tasks/:id`**
   - **Param:** `id` (ParseIntPipe).
   - **Body (`UpdateTaskDto`):** Kế thừa `PartialType(CreateTaskDto)`.
   - **Xử lý:** Kiểm tra task tồn tại thuộc về user $\rightarrow$ Kiểm tra đổi status sang/rời `DONE` để điều chỉnh `completed_at` $\rightarrow$ Update vào DB.

5. **`DELETE /api/tasks/:id`**
   - **Param:** `id` (ParseIntPipe).
   - **Xử lý:** Xóa task thuộc `user_id`. Trả về `{ success: true, data: { deletedId: id } }`.

---

#### C. Categories Module (`/api/categories`) - Yêu cầu Guard

1. **`GET /api/categories`**
   - Trả về danh sách categories thuộc sở hữu của user, kèm số lượng tasks liên kết (nếu cần).
2. **`POST /api/categories`**
   - **Body (`CreateCategoryDto`):**
     - `name`: String, 1–100 ký tự (bắt buộc).
     - `color`: String, hex/tên màu (tùy chọn).
     - `icon`: String (tùy chọn).
   - **Xử lý:** Bắt lỗi trùng tên trong cùng một user (`uq_categories_user_name` $\rightarrow$ trả về `409 Conflict`).
3. **`PATCH /api/categories/:id`**
   - **Param:** `id` (Int). Sửa `name`, `color`, `icon`.
4. **`DELETE /api/categories/:id`**
   - **Param:** `id` (Int). Xóa danh mục (các tasks liên quan tự động chuyển `category_id = null`).

---

## 5. Cấu trúc Thư mục Mã nguồn (Project Structure)

Backend tuân thủ kiến trúc phân tầng rõ ràng của NestJS:

```text
src/
├── app.module.ts                   # Root Module liên kết các module con
├── main.ts                         # Bootstrap app, setup prefix /api, ValidationPipe
│
├── common/                         # Dùng chung toàn hệ thống
│   ├── decorators/
│   │   └── current-user.decorator.ts  # @CurrentUser() lấy payload user từ request
│   ├── filters/
│   │   └── http-exception.filter.ts   # Exception filter chuẩn hóa lỗi đầu ra
│   ├── guards/
│   │   └── jwt-auth.guard.ts          # AuthGuard kiểm tra JWT
│   └── interceptors/
│       └── response.interceptor.ts    # Bọc dữ liệu trả về { success: true, data, timestamp }
│
├── database/                       # Tầng kết nối Database
│   ├── database.module.ts
│   └── prisma.service.ts           # Quản lý vòng đời Prisma Client và kết nối DB
│
├── generated/
│   └── prisma/                     # Client sinh ra từ 'prisma generate'
│
└── modules/
    ├── auth/                       # Module Xác thực (Register, Login, Token)
    │   ├── dto/                    # register.dto.ts, login.dto.ts
    │   ├── strategies/             # jwt.strategy.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.module.ts
    │
    ├── users/                      # Module Người dùng
    │   ├── dto/
    │   ├── users.repository.ts     # Truy vấn dữ liệu Users
    │   ├── users.service.ts
    │   ├── users.controller.ts
    │   └── users.module.ts
    │
    ├── tasks/                      # Module Công việc cốt lõi
    │   ├── dto/                    # create-task.dto.ts, update-task.dto.ts, query-task.dto.ts
    │   ├── tasks.repository.ts     # Truy vấn Prisma tasks
    │   ├── tasks.service.ts        # Xử lý logic nghiệp vụ, completed_at, status
    │   ├── tasks.controller.ts     # Tiếp nhận HTTP request
    │   └── tasks.module.ts
    │
    └── categories/                 # Module Danh mục
        ├── dto/                    # create-category.dto.ts, update-category.dto.ts
        ├── categories.repository.ts
        ├── categories.service.ts
        ├── categories.controller.ts
        └── categories.module.ts
```

---

## 6. Hướng dẫn Cài đặt & Khởi chạy (Local Setup)

### 6.1. Yêu cầu Tiên quyết
- Node.js version 20.x hoặc 22.x LTS trở lên.
- PostgreSQL đang chạy (Local port `5432` hoặc qua Docker).

### 6.2. Các bước Cài đặt

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Cấu hình file `.env`:**
   Tạo file `.env` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Cấu hình thông số DB thực tế của bạn:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:password@localhost:5432/todolist_db?schema=public"
   JWT_SECRET="your_secure_jwt_secret_key_minimum_32_characters"
   JWT_EXPIRES_IN="1d"
   ```

3. **Chạy Migration & Sinh Prisma Client:**
   ```bash
   # Sinh client vào thư mục src/generated/prisma
   npx prisma generate

   # Chạy migrate để tạo bảng trên PostgreSQL
   npx prisma migrate dev --name init
   ```

4. **Khởi chạy Server:**
   ```bash
   # Chạy chế độ phát triển (Hot reload)
   npm run start:dev

   # Build dự án
   npm run build

   # Chạy chế độ Production
   npm run start:prod
   ```
   API sẽ sẵn sàng phục vụ tại: `http://localhost:3000/api`

5. **Chạy Tests & Linter:**
   ```bash
   # Chạy Unit Tests bằng Vitest
   npm run test

   # Chạy E2E Tests
   npm run test:e2e

   # Kiểm tra linting với Oxlint
   npm run lint

   # Format code với Prettier
   npm run format
   ```

---

## 7. Checklist Kiểm thử Backend (Testing & QA)

Trước khi coi một module là hoàn thành, hãy kiểm tra qua danh sách này:

- [ ] **Auth Tests:**
  - Đăng ký tài khoản thành công $\rightarrow$ Mật khẩu lưu trong DB đã được hash, không trả về `password_hash`.
  - Đăng ký lại với email đã tồn tại $\rightarrow$ Trả về mã lỗi `409 Conflict`.
  - Đăng nhập sai email/mật khẩu $\rightarrow$ Trả về mã lỗi `401 Unauthorized`.
  - Gửi request không có token tới private routes $\rightarrow$ Trả về `401`.
- [ ] **Tenant Isolation (Bảo mật Đa người dùng):**
  - Tạo User 1 và User 2. User 1 tạo Task #10.
  - User 2 gọi `GET /api/tasks/10`, `PATCH /api/tasks/10`, `DELETE /api/tasks/10` $\rightarrow$ Đều phải nhận được `404 Not Found`.
- [ ] **Validation Tests:**
  - Tạo task với `title` rỗng hoặc toàn dấu cách $\rightarrow$ Trả về `400 Bad Request`.
  - Gửi `status` hoặc `priority` không nằm trong enum $\rightarrow$ Trả về `400 Bad Request`.
  - Gửi trường lạ không có trong DTO $\rightarrow$ Bị chặn bởi `forbidNonWhitelisted: true`.
- [ ] **Trạng thái & CompletedAt:**
  - Chuyển status từ `TODO` sang `DONE` $\rightarrow$ `completed_at` có giá trị thời gian UTC hợp lệ.
  - Chuyển status từ `DONE` về `IN_PROGRESS` $\rightarrow$ `completed_at` tự động reset về `null`.
- [ ] **Category Cascade:**
  - Tạo 1 Category và gán vào Task.
  - Xóa Category đó $\rightarrow$ Category bị xóa, nhưng Task vẫn tồn tại và có `category_id = null`.
- [ ] **Search, Filter & Sort:**
  - Tìm kiếm keyword kết hợp lọc `status` và `sort=deadline` cho kết quả chính xác theo đúng `skip/take` của trang.
  - Bộ lọc `overdue` chỉ trả về các task chưa DONE và deadline < thời điểm hiện tại.

---

## 8. Lộ trình Triển khai từng bước (Sprint Roadmap)

- [x] **Sprint 0: Setup & Database Schema**
  - Khởi tạo repo NestJS, cài đặt Prisma 7 với adapter PostgreSQL.
  - Định nghĩa models `users`, `categories`, `tasks` và migration thành công.
- [ ] **Sprint 1: Authentication & User Scope**
  - Hoàn thiện `AuthService`, băm mật khẩu `bcrypt`, ký JWT token.
  - Viết `JwtAuthGuard`, `JwtStrategy` và `@CurrentUser()` decorator.
- [ ] **Sprint 2: Task CRUD & Core Business Logic**
  - Xây dựng `TasksModule` (Controller, Service, Repository).
  - Áp dụng logic `completed_at` tự động theo trạng thái `DONE`.
  - Chặn quyền theo `user_id` trên toàn bộ các endpoint của Task.
- [ ] **Sprint 3: Category Module & Relationships**
  - Xây dựng `CategoriesModule`.
  - Kiểm tra quyền sở hữu category trước khi gán vào task.
  - Xác nhận quan hệ `SetNull` khi xóa Category.
- [ ] **Sprint 4: Advanced Querying (Search, Filter, Paging)**
  - Cài đặt `QueryTaskDto` và xử lý build `where`, `orderBy`, `take`, `skip` trong Prisma.
  - Bổ sung logic tính toán `view: overdue | today | upcoming`.
- [ ] **Sprint 5: Testing, Hardening & Swagger**
  - Viết unit tests cho Service và integration test cho Controller bằng Vitest.
  - Thiết lập Swagger OpenAPI (`/api/docs`) để hỗ trợ Frontend tích hợp dễ dàng.

---

## 9. Những điểm kỹ thuật cần lưu ý & Chốt

1. **Kiểu ID (Integer vs UUID):**
   - Hiện tại schema đang sử dụng `Int @id @default(autoincrement())`. Tầng DTO và URL param sử dụng `ParseIntPipe`.
2. **Quy ước múi giờ (Timezone):**
   - PostgreSQL lưu trữ kiểu `timestamptz`. Toàn bộ dữ liệu date được trả về dưới dạng ISO 8601 UTC kết thúc bằng `Z`.
3. **Hard Delete vs Soft Delete:**
   - Trong giai đoạn MVP, Backend thực hiện xóa trực tiếp bản ghi (`hard delete`). Nếu sau này nhóm quyết định làm tính năng *Undo Delete*, sẽ bổ sung trường `deleted_at: DateTime?` và chuyển đổi logic query.
4. **Không tin tưởng dữ liệu Client:**
   - Mọi thông tin nhạy cảm liên quan đến danh tính và quyền sở hữu (`userId`, ngày tạo, ngày sửa) đều do Backend tự quản lý và gán giá trị từ server context.
