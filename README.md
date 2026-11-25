# BÀI TOÁN 8-PUZZLE — MÔ PHỎNG THUẬT TOÁN TÌM KIẾM BFS & DFS
**Họ và tên:** Trần Gia Kiệt  
**MSSV:** 24110103  
**Học phần:** Trí tuệ nhân tạo (AI)

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN (ĐÃ TÁCH FILE ASSETS)
```text
AI_project_algorithm/
├── index.html               # File giao diện HTML chính (tinh gọn, thoáng đãng)
├── run_app.bat              # Nhấp đúp để mở ứng dụng ngay trên trình duyệt
├── demo_8puzzle_bfs_dfs.py  # Mã nguồn Python 9 hàm chuẩn theo bài tập Colab
├── README.md                # Tài liệu tóm tắt dự án
└── assets/                  # Thư mục tài nguyên dễ dàng chỉnh sửa
    ├── style.css            # Toàn bộ CSS phong cách trắng sáng tối giản
    └── app.js               # Toàn bộ mã nguồn JavaScript thuật toán & giao diện
```

---

## 🎨 CÁC CẢI TIẾN GIAO DIỆN MỚI
1. **Tone màu trắng sáng chủ đạo (Minimal Light Theme):** Nền sáng nhẹ nhàng `#f8fafc`, các khối thẻ trắng tinh tế viền xám nhạt `#e2e8f0`, chữ đen rõ nét, tạo cảm giác thanh thoát và hiện đại.
2. **Bố cục thu nhỏ & thông thoáng hơn:** Bàn cờ 3x3 thu gọn lại kích thước 190px gọn gàng, khoảng cách giữa các phần cân đối, không gây rối mắt khi demo.
3. **Frontier & Endpoint tinh gọn thành dạng List:**
   - **Frontier:** Hiển thị danh sách các node đang chờ dạng thanh cuộn mượt mà với số thứ tự, trạng thái tuple và hành động. Đánh dấu rõ node kế tiếp sẽ được lấy ra (`popleft` với BFS, `pop` với DFS).
   - **Endpoint:** Hiển thị trạng thái đích kèm danh sách các bước di chuyển (Solution Path) từ bước khởi tạo đến khi giải xong.
4. **Tách biệt mã nguồn:** CSS và JS được đặt gọn trong thư mục `assets/` giúp bạn dễ dàng chỉnh sửa màu sắc, kích thước hay thuật toán mà không làm xáo trộn mã HTML.
5. **Nút điều chỉnh tốc độ chạy:** Thanh trượt tốc độ từ 50ms đến 1500ms cùng các nút Play/Pause, Bước tiếp, Bước lùi và Reset.
