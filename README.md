Link: https://final-educore-management-1kypitgzb-thienzans-projects.vercel.app/

# EduCore Management System

Hệ thống quản lý học tập với tích hợp MySQL database qua XAMPP.

## 🚀 Tính năng

- Quản lý người dùng (Admin, Giảng viên, Sinh viên)
- Quản lý môn học và lớp học phần
- Phân công giảng dạy
- Đăng ký học phần
- Quản lý điểm số và thang điểm
- Dashboard cho từng vai trò

## 📋 Yêu cầu hệ thống

- Node.js (v18 trở lên)
- XAMPP (hoặc MySQL server)
- npm hoặc yarn

## 🛠️ Cài đặt

### Bước 1: Setup Database

Xem chi tiết trong file [SETUP_DATABASE.md](./SETUP_DATABASE.md)

Tóm tắt:
1. Khởi động XAMPP (Apache và MySQL)
2. Mở phpMyAdmin: `http://localhost/phpmyadmin`
3. Chạy file `database/schema.sql` để tạo database và tables
4. (Tùy chọn) Chạy file `database/seed.sql` để import dữ liệu mẫu

### Bước 2: Cấu hình Backend

```bash
cd server
cp env.example .env
```

Chỉnh sửa file `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Để trống nếu không có password
DB_NAME=educore_db
PORT=3001
```

### Bước 3: Cài đặt Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
# Ở thư mục gốc
npm install
```

## 🏃 Chạy ứng dụng

### Terminal 1 - Backend Server:
```bash
cd server
npm run dev
```
Server chạy tại: `http://localhost:3001`

### Terminal 2 - Frontend:
```bash
npm run dev
```
Frontend chạy tại: `http://localhost:3000`

## 🔑 Tài khoản mẫu

Sau khi import `seed.sql`:

- **Admin**: 
  - Email: `admin@hcmut.edu.vn`
  - Password: `123`

- **Giảng viên**: 
  - Email: `a2400001@hcmut.edu.vn` đến `a2400005@hcmut.edu.vn`
  - Password: `123`

- **Sinh viên**: 
  - Email: `2400001@hcmut.edu.vn` đến `2400040@hcmut.edu.vn`
  - Password: `123`

## 📁 Cấu trúc dự án

```
educore-management/
├── components/          # React components
├── context/            # React Context (State management)
├── database/           # SQL scripts (schema, seed)
├── server/             # Backend API server
│   ├── config/        # Database config
│   ├── routes/        # API routes
│   └── utils/         # Utilities
├── src/
│   └── services/      # API service layer
└── types.ts           # TypeScript types
```

## 🔧 Scripts

### Backend:
- `npm run dev` - Chạy server với auto-reload
- `npm start` - Chạy server production

### Frontend:
- `npm run dev` - Chạy dev server
- `npm run build` - Build cho production
- `npm run preview` - Preview production build

## 📚 API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Đăng nhập
- `GET /api/users` - Lấy danh sách users
- `GET /api/courses` - Lấy danh sách courses
- `GET /api/classes` - Lấy danh sách classes
- `GET /api/grades` - Lấy danh sách grades
- ... và nhiều endpoints khác

Xem chi tiết trong các file route trong `server/routes/`

## 🐛 Xử lý lỗi

### Lỗi kết nối database:
- Kiểm tra MySQL đã start trong XAMPP
- Kiểm tra thông tin trong `.env`

### Lỗi CORS:
- Đảm bảo backend đang chạy trên port 3001
- Kiểm tra cấu hình CORS trong `server/index.js`

### Lỗi import module:
- Chạy `npm install` lại
- Xóa `node_modules` và `package-lock.json` rồi cài lại

## 📝 Ghi chú

- Database chỉ lưu trữ trên máy local
- Để backup: Export từ phpMyAdmin
- Để restore: Import file SQL vào phpMyAdmin

## 📄 License

MIT
