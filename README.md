# Multi-Channel Inventory Management (Microservices)

## Mục tiêu
Thiết kế hệ thống quản lý tồn kho đa kênh (Amazon, Wayfair, …) theo kiến trúc **microservices** bằng NestJS.  
Repo này chỉ dựng **skeleton code cho hệ thống quản lý tồn kho đa kênh**, chưa kết nối DB và RabbitMQ thật, nhưng đã chuẩn bị sẵn để mở rộng.

---

## Các Services

- **API Gateway**  
  Entry point cho client/frontend.

- **Auth Service**  
  Quản lý user, role, permission. (Dùng cho toàn hệ thống) và sẽ triển khai ở câu 2

- **Product Service**  
  Quản lý dữ liệu master sản phẩm (SKU, giá, thuộc tính).

- **Inventory Service**  
  Quản lý số lượng tồn kho. Stub API:  
  - `POST /inventory/update` → log update, giả lập emit event.

- **Channel Service**  
  Mapping SKU nội bộ ↔ SKU ngoài (Amazon, Wayfair).  
  Stub consumer: nhận event `inventory.updated`, log kết quả.

- **Reporting Service**  
  Ghi log đồng bộ và thống kê.  
  Stub consumer: nhận event `inventory.updated`, log ra console.

---

## Luồng đồng bộ (Stub)

1. **Inventory Service** cập nhật tồn kho (`POST /inventory/update`).  
2. Thực tế sẽ **emit event `inventory.updated`** qua RabbitMQ.  
3. **Channel Service** và **Reporting Service** sẽ subscribe event này.  
4. Hiện tại, cả 2 service chỉ log dữ liệu ra console (stub).  

---

## Lý do chia microservices

- **Phân tách rõ ràng trách nhiệm**: Mỗi service chỉ tập trung vào một nghiệp vụ (Auth, Product, Inventory, Channel, Reporting). Điều này giúp code dễ đọc, dễ bảo trì và dễ phân công cho nhiều người trong team.  

- **Giảm rủi ro ảnh hưởng chéo**: Nếu Inventory Service gặp sự cố, các service khác (như Auth hay Product) vẫn có thể hoạt động bình thường.  

- **Thuận tiện cho mở rộng**: Khi số lượng kênh bán hàng tăng (Amazon, Wayfair, ...), chỉ cần scale Channel Service thay vì phải scale cả hệ thống.  

- **Chuẩn bị cho tương lai**: Dù hiện tại hệ thống chỉ chạy local với stub, việc thiết kế microservices từ đầu giúp dễ dàng tích hợp RabbitMQ, MySQL riêng cho từng service, hoặc chuyển sang gRPC/Kafka sau này mà không cần viết lại toàn bộ.

## Hướng phát triển

- Thêm kết nối MySQL riêng cho từng service.  
- Triển khai RabbitMQ thật (`inventory.updated` → channel/reporting).  
- Viết migration và entity cho các bảng.  
- Monitoring + logging chi tiết.

---

> 🔧 Hiện tại repo này chỉ phục vụ **Câu 1 của test**: trình bày tư duy kiến trúc và skeleton code.  
> Để chạy API thực sự (Câu 2), sẽ build thêm Auth Service đầy đủ (JWT + refresh + rate limit).
