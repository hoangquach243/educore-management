# Hướng dẫn Setup Database với XAMPP

## Bước 1: Cài đặt và khởi động XAMPP

1. Tải và cài đặt XAMPP từ: https://www.apachefriends.org/
2. Mở XAMPP Control Panel
3. Start **Apache** và **MySQL**

## Bước 2: Tạo Database

1. Mở trình duyệt và truy cập: `http://localhost/phpmyadmin`
2. Click vào tab **SQL**
3. Copy và paste nội dung từ file `database/schema.sql`
4. Click **Go** để chạy script
5. Database `educore_db` sẽ được tạo cùng với tất cả các bảng

## Bước 3: Import dữ liệu mẫu (Tùy chọn)

1. Vẫn trong phpMyAdmin, chọn database `educore_db`
2. Click tab **SQL**
3. Copy và paste nội dung từ file `database/seed.sql`
4. Click **Go** để import dữ liệu mẫu

## Bước 4: Cấu hình Backend Server

1. Vào thư mục `server/`
2. Copy file `env.example` thành `.env`:
   ```bash
   cd server
   cp env.example .env
   ```

3. Mở file `.env` và cập nhật thông tin database:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=          # Để trống nếu không có password
   DB_NAME=educore_db
   PORT=3001
   ```

## Bước 5: Cài đặt Dependencies

### Backend:
```bash
cd server
npm install
```

### Frontend:
```bash
# Ở thư mục gốc
npm install
```

## Bước 6: Chạy ứng dụng

### Terminal 1 - Backend Server:
```bash
cd server
npm run dev
```
Server sẽ chạy tại: `http://localhost:3001`

### Terminal 2 - Frontend:
```bash
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:3000`

## Kiểm tra kết nối

1. Mở trình duyệt và truy cập: `http://localhost:3001/api/health`
2. Nếu thấy `{"status":"OK","message":"Server is running"}` thì backend đã hoạt động
3. Truy cập `http://localhost:3000` để sử dụng ứng dụng

## Tài khoản mẫu

Sau khi import `seed.sql`, bạn có thể đăng nhập với:

- **Admin**: 
  - Email: `admin@hcmut.edu.vn`
  - Password: `123`

- **Giảng viên**: 
  - Email: `a2400001@hcmut.edu.vn` đến `a2400005@hcmut.edu.vn`
  - Password: `123`

- **Sinh viên**: 
  - Email: `2400001@hcmut.edu.vn` đến `2400040@hcmut.edu.vn`
  - Password: `123`

## Xử lý lỗi thường gặp

### Lỗi: "Cannot connect to MySQL"
- Kiểm tra MySQL đã được start trong XAMPP chưa
- Kiểm tra thông tin trong file `.env` có đúng không

### Lỗi: "Access denied for user"
- Kiểm tra username và password trong `.env`
- Mặc định XAMPP MySQL không có password (để trống)

### Lỗi: "Database doesn't exist"
- Chạy lại file `schema.sql` trong phpMyAdmin
- Kiểm tra tên database trong `.env` có đúng không

### Lỗi CORS
- Đảm bảo backend đang chạy trên port 3001
- Kiểm tra file `vite.config.ts` có cấu hình proxy không (nếu cần)

## Lưu ý

- Database chỉ lưu trữ trên máy local
- Dữ liệu sẽ mất nếu xóa database hoặc reinstall XAMPP
- Để backup database: Export từ phpMyAdmin → tab Export
- Để restore: Import file SQL vào phpMyAdmin

