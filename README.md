# BÀI TOÁN 8-PUZZLE — TÌM KIẾM BFS & DFS
**Họ và tên:** Trần Gia Kiệt  
**MSSV:** 24110103  
**Học phần:** Trí tuệ nhân tạo (AI)

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN
```text
AI_project_algorithm/
├── README.md                # Tài liệu tóm tắt dự án
├── run_app.bat              # Nhấp đúp chuột để chạy demo ngay
├── src/
│   └── demo_8puzzle_bfs_dfs.py  # Mã nguồn Python 9 hàm chuẩn theo Colab
└── assets/
    ├── index.html           # Giao diện chính (HTML trắng sáng, tinh gọn)
    ├── style.css            # Toàn bộ CSS phong cách trắng sáng tối giản
    └── app.js               # Backend bài toán 8-Puzzle & thuật toán BFS/DFS
```

---

## 🎯 CÁC TÍNH NĂNG CHÍNH ĐÃ HOÀN THIỆN
1. **Combo Box Thuật toán:** Chọn linh hoạt giữa `BFS (Hàng đợi FIFO)` và `DFS (Ngăn xếp LIFO)`.
2. **Combo Box Bài toán:** Hiện tại tập trung độc quyền vào `🧩 Bài toán 8-Puzzle`, giữ nguyên cấu trúc combo box để bạn dễ dàng cắm thêm bài toán mới sau này.
3. **Combo Box Đề bài (Presets):** Các cấu hình ban đầu mẫu từ bài tập Colab (2 bước giải), rất ngắn (1 bước), 4 bước, 6 bước hoặc tự nhập mảng.
4. **Nút Đổi đề (🎲):** Tự động tạo ngẫu nhiên một đề bài mới hợp lệ (chắc chắn giải được).
5. **Giao diện trắng sáng, tinh gọn:**
   - **NODE:** Bàn cờ 190px với các ô số bo góc thanh lịch, thông tin State, Path Cost, Depth.
   - **FRONTIER:** Danh sách List đơn giản, highlight node kế tiếp lấy ra.
   - **ENDPOINT:** Trạng thái đích và danh sách các bước về đích.
   - **BẢNG VẾT DUYỆT TỪNG STEP:** Bảng chi tiết, nhấp vào dòng bất kỳ để xem lại trạng thái.
6. **Điều chỉnh tốc độ run:** Thanh trượt từ 50ms đến 1500ms cùng các nút Play/Pause, Tiến/Lùi.
