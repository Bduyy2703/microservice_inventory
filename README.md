# Multi-Channel Inventory Management (Microservices)
---------
## 🎯 Mục Tiêu
Xây dựng hệ thống quản lý tồn kho đa kênh dựa trên microservices.
Cung cấp skeleton code cho các service: API Gateway, Auth, Product, Inventory, Channel, Reporting.
Chuẩn bị tích hợp thực tế với MySQL, Redis, và RabbitMQ (hiện tại là stub).
Sử dụng Docker để đóng gói và chạy Auth Service.

---------
## 🏛️ Kiến Trúc Hệ Thống

Hệ thống được chia thành các microservices độc lập, mỗi service đảm nhận một nhiệm vụ cụ thể:
API Gateway
Điểm vào cho client/frontend.
Chuyển hướng request đến các service phù hợp (Auth, Product, Inventory).
Tương lai: Thêm rate limit và xác thực.

Auth Service
Quản lý xác thực người dùng, vai trò (role) và quyền (permission).
Chuẩn bị cho Câu 2: Triển khai JWT, refresh token, rate limit.
Dùng MySQL lưu user/role, Redis cho rate limit và blacklist token.

Product Service
  Quản lý dữ liệu sản phẩm (SKU, tên, giá, thuộc tính như kích thước, màu sắc).
  API:
    POST /products: Tạo sản phẩm.
    GET /products/:sku: Lấy thông tin sản phẩm.
    PUT /products/:sku: Cập nhật sản phẩm.
    DELETE /products/:sku: Xóa sản phẩm.
  Lý do: Tập trung dữ liệu sản phẩm, tránh trùng lặp, dễ cache bằng Redis.

Inventory Service
    Quản lý số lượng tồn kho cho từng SKU.
    Stub API: POST /inventory/update (log thay đổi, giả lập emit event).

Channel Service
    Ánh xạ SKU nội bộ với SKU ngoài (Amazon, Wayfair).
    Stub consumer: Nhận event inventory.updated, log kết quả.

Reporting Service
    Ghi log đồng bộ và tạo báo cáo.
    Stub consumer: Nhận event inventory.updated, log ra console.

--------
## 🔄 Luồng Đồng Bộ Tồn Kho (Stub)
Inventory Service:
Client gọi POST /inventory/update để cập nhật tồn kho (ví dụ: { "sku": "ABC123", "quantity": 50 }).
Log thay đổi và giả lập emit event inventory.updated qua RabbitMQ.

Channel Service:
Nhận event inventory.updated (stub).
Log dữ liệu (ví dụ: { sku: "ABC123", quantity: 50 }).

Reporting Service:
Nhận event inventory.updated (stub).
Log để báo cáo (ví dụ: Tồn kho SKU ABC123 cập nhật: 50 đơn vị).

---------

## Lý do chia microservices

- **Phân tách rõ ràng trách nhiệm**: Mỗi service chỉ tập trung vào một nghiệp vụ (Auth, Product, Inventory, Channel, Reporting). Điều này giúp code dễ đọc, dễ bảo trì và dễ phân công cho nhiều người trong team.  

- **Giảm rủi ro ảnh hưởng chéo**: Nếu Inventory Service gặp sự cố, các service khác (như Auth hay Product) vẫn có thể hoạt động bình thường.  

- **Thuận tiện cho mở rộng**: Khi số lượng kênh bán hàng tăng (Amazon, Wayfair, ...), chỉ cần scale Channel Service thay vì phải scale cả hệ thống.  

- **Chuẩn bị cho tương lai**: Dù hiện tại hệ thống chỉ chạy local với stub, việc thiết kế microservices từ đầu giúp dễ dàng tích hợp RabbitMQ, MySQL riêng cho từng service, hoặc chuyển sang gRPC/Kafka sau này mà không cần viết lại toàn bộ.

## --------
## 🚀 Hướng Phát Triển
Kết nối database:
Thêm MySQL cho Product (products table) và Inventory (inventory table).
Viết entity và migration bằng TypeORM.
Kết nối RabbitMQ:
Triển khai producer/consumer thực tế cho event inventory.updated.
Kết nối Inventory, Channel, Reporting Service qua queue.

## ---------
# 📚 Công Nghệ Sử Dụng
NestJS: Framework backend cho microservices.
Docker: Đóng gói service và dependencies.
MySQL: Lưu trữ user, sản phẩm, tồn kho (stub).
Redis: Rate limit và blacklist token (stub).
RabbitMQ: Queue cho đồng bộ tồn kho (stub).
> 🔧 Hiện tại repo này chỉ phục vụ **Câu 1 của test**: trình bày tư duy kiến trúc và skeleton code
> Để chạy API thực sự (Câu 2), sẽ build thêm Auth Service đầy đủ (JWT + refresh + rate limit).
