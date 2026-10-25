# QUY TẮC BẮT BUỘC CHO DỰ ÁN

## Môi trường
- Windows 11 + PowerShell 5.1. TUYỆT ĐỐI KHÔNG dùng lệnh Linux: ls -la, rm -rf, touch, cat, cp -r, export.
- KHÔNG dùng && để nối lệnh. Chạy từng lệnh riêng hoặc dùng dấu ;
- Xem thư mục: Get-ChildItem. Tạo file: New-Item. Xóa: Remove-Item -Recurse -Force.
- Python 3.14, venv ở backend\venv. Kích hoạt: .\venv\Scripts\Activate.ps1
- Windows Smart App Control chặn các file .exe trong venv: LUÔN dùng `python -m pip`, `python -m uvicorn`, `python -m alembic`. KHÔNG gọi trực tiếp pip/uvicorn/alembic.
- SQLAlchemy đã cài bản Python thuần để tránh bị chặn. KHÔNG cài lại, KHÔNG nâng cấp SQLAlchemy.
- KHÔNG sửa backend/requirements.txt về phiên bản cũ. Không khóa cứng phiên bản thư viện Python (trừ bcrypt==4.0.1).
- Người dùng tự chạy backend ở terminal riêng, KHÔNG tự khởi động lại uvicorn.
- Nếu lệnh bị Windows chặn ("Application Control policy"), dừng lại và báo người dùng.

## Dự án
- Tên shop: "Phin & Bean". Không để placeholder [TÊN SHOP] ở bất kỳ đâu.
- Đọc PROJECT_SPEC.md trước mỗi giai đoạn và làm đúng theo đó, nhất là mục 4 "Quy tắc nghiệp vụ đã chốt".
- Làm đúng 1 giai đoạn mỗi lần, xong thì dừng và gửi checklist.

## Chất lượng
- Sau khi sửa frontend, chạy `npx tsc --noEmit` trong thư mục frontend và sửa hết lỗi trước khi báo xong.
- Không được báo hoàn thành khi tab Problems còn lỗi.
- Không xóa hoặc viết lại code đang chạy ổn nếu không được yêu cầu.