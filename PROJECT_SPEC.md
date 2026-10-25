# PROJECT SPEC — Phin & Bean

Website thương mại điện tử "Phin & Bean" (slogan: "Cà phê Việt, chuẩn vị mỗi sáng") bán cà phê: hạt rang, cà phê phin, cold brew, dụng cụ pha chế, quà tặng.
Vai trò: AI là Senior Full-stack Engineer kiêm UI/UX Designer. Người dùng là Product Manager.

## 1. Tech stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
  - Router: React Router v6
  - Server state: TanStack Query; client state (giỏ hàng, auth): Zustand (persist localStorage)
  - Form: React Hook Form + Zod
  - Icon: lucide-react; Biểu đồ: Recharts; Toast: sonner
  - Gọi API: axios, interceptor tự gắn JWT, gặp 401 thì đăng xuất và về trang đăng nhập
- Backend: FastAPI (Python 3.14)
  - ORM: SQLAlchemy 2 + Pydantic v2; Migration: Alembic
  - Auth: JWT (python-jose) + bcrypt (passlib)
  - Database: SQLite cho dev, cấu hình qua DATABASE_URL để đổi sang MySQL
  - AI Chatbot: Google Gemini API (google-genai), key trong .env
- Kiến trúc: tách Client/Server. Backend theo lớp: routers → services → models → schemas.

## 2. Cấu trúc thư mục
/backend
  app/main.py, app/core (config, security, deps), app/models, app/schemas,
  app/routers, app/services, app/db (session, seed.py), alembic/
  .env.example, requirements.txt
/frontend
  index.html, vite.config.ts, tailwind.config.js
  src/api, src/components (ui, layout, product, cart, admin, chat),
  src/pages (customer, admin), src/stores, src/hooks, src/lib, src/types
README.md (hướng dẫn chạy trong ≤ 5 lệnh)

## 3. Database
- users (id, full_name, email unique, password_hash, phone, address, role: customer|admin, created_at)
- categories (id, name, slug, image_url)
- products (id, name, slug, description, price, sale_price nullable, stock, image_url, images JSON,
  category_id, is_featured, is_active, avg_rating, created_at)
- reviews (id, product_id, user_id, rating 1-5, comment, created_at) — chỉ user có đơn completed chứa sản phẩm mới được đánh giá
- carts / cart_items (giỏ hàng theo user trên server)
- orders (id, code, user_id, total_amount, shipping_fee, status, shipping_name, shipping_phone, shipping_address,
  payment_method: cod|mock_card|vietqr, payment_status: unpaid|paid|failed, note, created_at)
- order_items (id, order_id, product_id, product_name, unit_price, quantity) — lưu giá tại thời điểm mua

## 4. Quy tắc nghiệp vụ đã chốt
- Trạng thái đơn (nhãn + màu đặt trong src/lib/constants.ts):
  pending = "Chờ xác nhận" (vàng), processing = "Đang xử lý" (xanh dương), shipping = "Đang giao" (tím),
  completed = "Đã hoàn thành" (xanh lá), cancelled = "Đã hủy" (xám/đỏ).
  Timeline 4 bước pending → processing → shipping → completed. Chỉ chuyển tiến, không lùi.
  Hủy được khi chưa sang shipping; hủy thì hoàn kho.
- Thanh toán giả lập (logic ở backend, không random):
  - COD: payment_status = unpaid, thành paid khi admin đặt completed.
  - Thẻ giả lập: form số thẻ/tên/MM-YY/CVV, xử lý 1.5s. 4242 4242 4242 4242 → thành công;
    4000 0000 0000 0002 → thất bại "Thẻ bị từ chối", không tạo đơn, giữ giỏ; số hợp lệ khác → thành công. Hiện gợi ý số thẻ test dưới form.
  - VietQR giả lập: hiện ảnh QR mẫu + nội dung chuyển khoản là mã đơn, nút "Tôi đã chuyển khoản".
- Phí ship 30.000đ, miễn phí cho đơn từ 500.000đ (thanh tiến trình "Mua thêm Xđ để được freeship").
- Tổng tiền luôn tính lại ở server, không tin giá từ client. Tạo đơn: kiểm tra tồn kho và trừ kho trong transaction.
- SĐT: ^(0|\+84)(3|5|7|8|9)\d{8}$ (Zod + Pydantic).
- Guest cart: Zustand + localStorage. Đăng nhập thì gộp vào giỏ server (cộng dồn, không vượt tồn kho), rồi xóa giỏ local.
- Chỉ tiếng Việt, không làm i18n. Tiền: Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}). Ngày: dd/MM/yyyy.

## 5. Chức năng
### Khách hàng
- Đăng ký / đăng nhập / đăng xuất, xem & sửa hồ sơ
- Trang chủ: hero banner, danh mục, sản phẩm nổi bật, sản phẩm mới
- Danh sách sản phẩm: tìm kiếm, lọc danh mục + khoảng giá, sắp xếp (mới nhất, giá tăng/giảm, đánh giá), phân trang server, bộ lọc đồng bộ URL
- Chi tiết sản phẩm: gallery, giá/giá KM, tồn kho, chọn số lượng, mô tả, đánh giá + form đánh giá, sản phẩm liên quan
- Giỏ hàng: thêm/sửa/xóa, tạm tính, phí ship, tổng; không vượt tồn kho
- Thanh toán: form giao hàng tự điền từ hồ sơ, chọn phương thức, tóm tắt đơn sticky; trang "Đặt hàng thành công" có mã đơn
- Đơn hàng của tôi: danh sách (tab theo trạng thái), chi tiết + timeline, hủy đơn

### Admin (/admin, chỉ role=admin; frontend chặn route, backend dùng require_admin)
- Dashboard: thẻ số liệu (doanh thu chỉ tính đơn completed, tổng đơn, tổng khách, sắp hết hàng),
  biểu đồ doanh thu 30 ngày (line), đơn theo trạng thái (pie), top 5 bán chạy, đơn mới nhất
- Sản phẩm: bảng tìm kiếm/lọc/phân trang, thêm/sửa trong dialog, upload ảnh (backend/static/uploads), bật/tắt còn hàng, xóa có xác nhận
- Danh mục: CRUD
- Đơn hàng: lọc theo trạng thái/ngày, xem chi tiết, cập nhật trạng thái (có xác nhận)
- Khách hàng: danh sách (chỉ xem)

### AI Chatbot
- POST /api/chat nhận { message, history[] }, giữ 10 tin gần nhất
- System prompt chứa sản phẩm đang bán (tên, giá, tồn kho, danh mục, mô tả ngắn):
  "Bạn là nhân viên tư vấn thân thiện của Phin & Bean. Chỉ tư vấn dựa trên dữ liệu sản phẩm được cung cấp,
  không bịa sản phẩm/giá. Trả lời ngắn gọn bằng tiếng Việt, gợi ý tối đa 3 sản phẩm phù hợp kèm giá."
- Trả về reply + suggested_product_ids; frontend hiện thẻ sản phẩm bấm được
- Rate limit 10 request/phút/IP, tối đa 500 ký tự/tin; vượt thì trả 429 kèm retry_after, frontend báo "Bạn nhắn hơi nhanh, đợi chút nhé"
- Xử lý lỗi khi API key sai/hết quota/timeout
- Widget: bong bóng chat góc phải dưới (không đè bottom nav), typing indicator, câu hỏi gợi ý ("Cà phê nào ít đắng?", "Quà tặng dưới 300k"), render markdown

## 6. UI/UX
- Phong cách hiện đại, tối giản, sang trọng; nhiều khoảng trắng, bo góc 12–16px, đổ bóng mềm
- Màu (design token trong tailwind.config): primary #6F4E37, accent #D4A373, nền #FAF7F2, chữ #1F1A17, viền #E8E1D9
- Font: Be Vietnam Pro
- Responsive mobile-first; lưới sản phẩm 2/3/4 cột (mobile/tablet/desktop)
- Bottom nav mobile 4 tab: Trang chủ, Sản phẩm, Giỏ hàng (badge), Tài khoản ("Đơn hàng của tôi" nằm trong Tài khoản). Ẩn ở checkout và admin.
- Header sticky, blur khi cuộn. Ô tìm kiếm: debounce 300ms, dropdown tối đa 5 gợi ý (ảnh, tên, giá) + "Xem tất cả kết quả", Enter → /products?search=..., hỗ trợ phím mũi tên/Esc; mobile mở toàn màn hình
- Product card: ảnh 1:1, hover phóng nhẹ + nút "Thêm vào giỏ", nhãn "-20%", "Hết hàng"
- Thêm vào giỏ: toast + mini cart drawer từ phải
- Đủ trạng thái: skeleton, empty state có nút hành động, trang 404, lỗi thân thiện; ảnh lỗi dùng placeholder (onError, ảnh trong frontend/public)
- Transition 150–300ms, nút có trạng thái loading
- Admin: sidebar thu gọn được, badge màu theo trạng thái đơn
- Accessibility: đủ tương phản, focus ring, alt ảnh, dùng được bằng bàn phím

## 7. Chất lượng
- TypeScript strict, không dùng any
- Backend validate bằng Pydantic, lỗi dạng { detail }, đúng HTTP status
- Không hard-code secret; có .env.example; CORS chỉ cho origin frontend
- seed.py: 1 admin (admin@shop.com / Admin@123), 3 khách hàng, 5 danh mục, 30 sản phẩm tên/mô tả tiếng Việt, giá 50.000đ–1.500.000đ, ảnh Unsplash thật (URL images.unsplash.com cố định), đơn hàng và đánh giá mẫu rải 30 ngày gần nhất
- Swagger tại /docs; comment ngắn ở logic quan trọng (auth, tạo đơn, chatbot)

## 8. Các giai đoạn
1. Khung dự án (backend skeleton + models + migration + /api/health; frontend Vite + Tailwind + shadcn + layout)
2. Xác thực JWT + trang đăng nhập/đăng ký + hồ sơ
3. Sản phẩm, danh mục, seed dữ liệu, trang chủ, danh sách, chi tiết
4. Giỏ hàng + thanh toán
5. Đơn hàng của tôi + đánh giá
6. Admin dashboard
7. AI chatbot
8. Đánh bóng UI/UX, kiểm thử
Xong mỗi giai đoạn: dừng lại, liệt kê file đã tạo/sửa, lệnh chạy, checklist kiểm tra. Không tự ý đổi tech stack hay xóa code đang chạy ổn.