# ⚔️ EduQuest – Học Viện Phiêu Lưu

> **Nền tảng Game Nhập vai Giáo dục 2D RPG & Đấu Trí Tri Thức**  
> *A 2D Fantasy RPG Educational Web Game where students battle monsters by answering curriculum-based quests.*

---

## 🌟 Giới Thiệu (Overview)

**EduQuest – Học Viện Phiêu Lưu** là nền tảng game hóa giáo dục (Gamified EdTech) kết hợp phong cách **2D Fantasy RPG Chibi Anime**, giúp học sinh biến các buổi học và bài tập khô khan thành hành trình phiêu lưu kỳ thú:
- Học sinh nhập vai thành các **Dũng Sĩ**, **Pháp Sư**, hoặc **Cung Thủ**.
- Chiến đấu với Quái vật và Boss thần thoại thông qua việc trả lời chính xác các câu hỏi học tập (Toán, Tiếng Anh, Khoa học...).
- Mở khóa kỹ năng chiến đấu (Roguelite Draft), thu thập trang bị, vàng, kim cương và nuôi Thú cưng đồng hành.
- Giáo viên có Studio tự tạo bộ 30 câu hỏi tùy chỉnh, giao bài và phát màn hình máy chiếu thi đấu trực tiếp cho toàn lớp.

---

## 🎮 Các Chế Độ Chơi (Game Modes)

1. **Phiêu Lưu Bản Đồ 10 Ải (Map Adventure)**: Khám phá từng vùng đất trên bản đồ hòn đảo huyền bí, đối đầu quái vật và Boss đảo.
2. **Hành Trình Tri Thức 30 Câu (30-Question Roguelite Journey)**: Chế độ khiêu chiến liên tục 30 câu hỏi với hệ thống nâng cấp kỹ năng Roguelite và Boss tiến hóa theo giai đoạn.
3. **Phòng Thi Đấu Trực Tiếp Lớp Học (Classroom Host & Player)**: Giáo viên tạo phòng thi đấu trên máy chiếu (như Kahoot/Blooket), học sinh dùng điện thoại nhập mã PIN tham gia tranh tài theo thời gian thực (Real-time Socket.io).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Backend**: Node.js, Express.js, Socket.io, JWT Authentication, Bcrypt.
- **Database**: PostgreSQL (pgAdmin 4) & SQLite WAL mode fallback.
- **Frontend**: React (in-browser standalone), Tailwind CSS, Canvas Confetti, Howler Sound Engine, KaTeX (render công thức Toán học đẹp mắt).
- **Game Engine**: CSS3 Hardware Accelerated 2D Animation, Particle VFX.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Cấu hình môi trường (`.env`):
Sao chép file `.env.example` thành `.env` và cập nhật thông tin PostgreSQL:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:123456@127.0.0.1:5432/eduquest
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=123456
PGDATABASE=eduquest
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Khởi tạo Cơ sở Dữ liệu:
Chạy script tự động nạp cấu trúc bảng vào PostgreSQL:
```bash
node scripts/setup_postgres_auto.js 123456
```

### 4. Khởi động Web Server:
```bash
npm start
```
Mở trình duyệt truy cập:
- **Trang chủ & Landing Page**: `http://localhost:3000/`
- **Game RPG 2D**: `http://localhost:3000/rpg.html`
- **Studio Quản Lý Bộ Câu Hỏi**: `http://localhost:3000/creator.html`
- **Máy Chiếu Lớp Học (Host)**: `http://localhost:3000/host.html`
- **Học Sinh Vào Phòng (Player)**: `http://localhost:3000/player.html`

---

## 👤 Tài Khoản Mẫu (Demo Accounts)

| Tên Đăng Nhập | Mật Khẩu | Vai Trò | Cấp Độ & Tài Sản |
| :--- | :--- | :--- | :--- |
| `hiepsi_nam` | `StudentPass@123` | Học sinh | Cung thủ Lv.8 • 1.500 Vàng • 80 Kim Cương |
| `hocsinh_a` | `hs123456` | Học sinh | Chiến binh Lv.15 • 2.000 Vàng • 120 Kim Cương |
| `hocsinh_b` | `hs123456` | Học sinh | Pháp sư Lv.4 • 500 Vàng • 30 Kim Cương |
| `cogaomai` | `TeacherPass@123` | Giáo viên | Quản lý Lớp 5A1 - Đại Hiệp Nhí (`L5A1-VIP`) |
| `admin_master` | `AdminPassword@123` | Quản trị | Toàn quyền kiểm soát hệ thống |

---

## 📜 Giấy Phép (License)
Dự án được phân phối dưới giấy phép [MIT](LICENSE).
