# Đại Ngàn Song Ngữ — Pages và Worker

Bản sửa từ `Dai-Ngan-Song-Ngu-da-sua(2).html`, 80.379.884 byte, SHA-256 `90d0a7ee0a848f5f1cddc29841e7c8d9e71ddf2fb569f855b74273179030382e`. Giữ bản gốc riêng. Không sử dụng token đã gửi qua chat.

## Thay đổi

- Một sidebar `#sb` nằm ngoài `#app`. Các trang chỉ thay nội dung chính. Logo cố định, cả 13 mục co giãn theo chiều cao cửa sổ, không cuộn sidebar. Độ rộng dùng chung qua `--sb-w`.
- Menu đầy đủ 13 đích, gồm Kho sách ngay dưới Ngữ pháp và các mục Chăm sóc, Giao tiếp, Luyện nói, Truyện, Góc giáo viên. Đổi active cả khi mở popup luyện nói.
- Xóa ba nút Chat mới, Dừng đọc, Dành cho thầy cô trong **khung gia sư**. Các nút Dừng đọc của truyện vẫn giữ nguyên. Nút đóng chat vẫn hủy yêu cầu và dừng âm thanh.
- Xóa ô nhập URL và đường cấu hình endpoint từ trình duyệt. Gộp transport thành một hàm `dtRemote` trong `site/tutor.js`.
- URL Worker tự lấy từ kết quả triển khai và ghi vào `site/public-config.js`. Không bịa subdomain workers.dev.
- Khi chưa có AI hoặc kết nối lỗi, chuyển sang tra học liệu và ghi rõ là học liệu trên máy. Không giả danh câu trả lời AI, không đưa đáp án cục bộ vào lịch sử gửi như phản hồi mô hình.
- Tách 609 lần nhúng ảnh/font. PNG chỉ chuyển sang WebP khi nhỏ hơn và đã kiểm tra kích thước cùng dữ liệu RGBA từng pixel giống nhau. Ảnh/font còn khoảng 49,3 MB, HTML 713 byte, JS lõi khoảng 1,45 MB, CSS lõi khoảng 249 KB. Tổng website không chỉ còn vài MB, nhưng không còn bắt điện thoại nhận cả HTML 80 MB một lần.

## Bảo toàn

Dữ liệu học tập nhúng được so sánh JSON trước/sau, trừ ánh xạ ảnh đổi đường dẫn. Giữ 1.000 từ, 500 mẫu ngữ pháp, 10 truyện và câu hỏi, 500 mẫu giao tiếp, trò chơi, chấm điểm, hồ sơ/localStorage, ghi âm/nhận dạng vốn có, sách/OCR và tốc độ đọc truyện 0,65/0,85/1. Luyện nói riêng vẫn dùng kịch bản cũ, không tự chuyển thành hội thoại AI.

## Dịch vụ AI

Bản này sử dụng **Gemini API qua Cloudflare Worker**, theo yêu cầu mới nhất; đã gỡ SDK OpenAI. SDK chính thức là `@google/genai`, gọi `models.generateContent`, nhận JSON theo schema. Model cấu hình phía máy chủ, mặc định `gemini-3.5-flash-lite` theo danh sách model còn hỗ trợ đối chiếu 30/10/2026; quyền truy cập/quota còn tùy tài khoản.

Khóa `GEMINI_API_KEY` chỉ nằm trong Worker secret. Trình duyệt chỉ biết URL `/api/tutor-chat`. Bốn nhóm safetySettings đều dùng `BLOCK_LOW_AND_ABOVE`. Giới hạn độ dài, quota và kiểm tra JSON vẫn hoạt động. Bộ lọc của nhà cung cấp không bảo đảm tuyệt đối nội dung an toàn hoặc chính xác; cần giáo viên đánh giá trước sử dụng.

**Giới hạn dịch vụ cần xử lý cho trẻ em:** điều khoản Gemini API hiện ghi không dùng Services trong ứng dụng hướng tới hoặc có khả năng được người dưới 18 tuổi truy cập. Giữ khóa trên Worker, trả phí hoặc có phụ huynh đứng cạnh không tự loại bỏ giới hạn này. Theo yêu cầu triển khai hiện tại, cấu hình đặt `AI_ENABLED=true`; đây là cấu hình kỹ thuật và không xác nhận ứng dụng đã đủ điều kiện cung cấp Gemini cho trẻ em. Cần có cơ sở dịch vụ/hợp đồng phù hợp do Google xác nhận trước khi cho học sinh sử dụng.

Dịch vụ miễn phí có thể sử dụng nội dung gửi lên để cải thiện sản phẩm theo điều khoản Google. Không gửi thông tin cá nhân, bí mật hoặc dữ liệu học sinh. Bộ lọc email/điện thoại chỉ giảm rủi ro, không bảo đảm phát hiện mọi dữ liệu riêng tư. Không lưu hội thoại ở Worker; hosting có thể có nhật ký truy cập riêng.

## Cấu trúc

| Thư mục hoặc tệp | Vai trò |
|---|---|
| `site/` | Tệp tĩnh duy nhất xuất bản lên Pages |
| `site/app-core.js`, `app-core.css` | Dữ liệu, chức năng và giao diện cũ |
| `site/app-shell.js`, `app-shell.css` | Sidebar cố định và căn chỉnh wrapper |
| `site/tutor.js` | Hội thoại và transport duy nhất |
| `site/public-config.js` | URL công khai, không có khóa |
| `site/assets/` | Ảnh/font đã tách |
| `worker/index.mjs` | API và Durable Object hạn mức |
| `worker/wrangler.jsonc` | Cấu hình Cloudflare, không chứa bí mật |
| `.github/workflows/pages.yml` | Tự triển khai Worker, gán URL và Pages |
| `source-manifest.json` | Hash nguồn và danh mục ảnh |

## Chạy trên máy

Cài Node.js LTS còn hỗ trợ, tối thiểu 22.9. Trong thư mục dự án:

```sh
npm ci
npm test
npm run check
npm run dev
```

Mở http://localhost:4173 và giữ Terminal chạy. AI mặc định chưa triển khai; tra học liệu vẫn dùng được. Cần giữ cả thư mục, không gửi riêng `index.html`. Không nhấp đúp HTML để kỳ vọng có backend. Muốn dựng lại từ nguồn, cài Pillow rồi chạy `python3 tools/split-source.py DUONG_DAN_HTML_GOC`; người sử dụng thông thường không cần chạy bước này.

## Đẩy lên repo

Repo mục tiêu: https://github.com/tuannguyen-tkd/DaiNganSongNgu

Repo còn trống khi kiểm tra. Kết nối GitHub đã được đề nghị nhưng chưa xác nhận, nên chưa có push hoặc Pages production được kiểm chứng. Thu hồi token đã gửi qua chat và tạo quyền mới qua kênh bí mật phù hợp. Không đặt token vào URL remote hoặc tệp dự án.

Đăng nhập GitHub qua VS Code/Git credential manager hoặc `gh auth login` trên máy của bạn. Nếu đang ở checkout đúng repo đã có commit:

```sh
git status
git push -u origin main
```

Nếu giải nén một bản không có `.git`:

```sh
git init -b main
git add .
git commit -m "Fix persistent sidebar and configure tutor Worker"
git remote add origin https://github.com/tuannguyen-tkd/DaiNganSongNgu.git
git push -u origin main
```

Nếu repo đã có thay đổi mới, pull/merge trước, không force-push.

## Tự triển khai và gán URL Worker

1. Trong repo, chọn **Settings → Pages → Source → GitHub Actions**.
2. Trong **Settings → Secrets and variables → Actions**, thêm secrets riêng:
   - `CLOUDFLARE_API_TOKEN`: token mới, giới hạn đúng tài khoản và quyền sửa Worker cần dùng.
   - `CLOUDFLARE_ACCOUNT_ID`: Account ID thật, không phải token hay tên Worker.
   - `GEMINI_API_KEY`: khóa Gemini API do quản trị viên giữ.
3. Biến Actions `AI_ENABLED` mặc định là `true` theo yêu cầu triển khai. Chỉ sử dụng AI với đối tượng phù hợp điều khoản Gemini API; cần xác nhận điều kiện sử dụng trước khi cho học sinh truy cập.
4. Chạy workflow **Deploy Dai Ngan Song Ngu** hoặc push main.
5. Workflow kiểm tra mã, deploy `dai-ngan-tutor`, lấy URL workers.dev thực từ Wrangler, kiểm tra `/health`, tự ghi `/api/tutor-chat` vào cấu hình của Pages artifact rồi xuất bản `site/`.

Thiếu quyền Cloudflare thì chỉ xuất bản phần học liệu, không tạo URL giả. Có quyền nhưng deploy lỗi thì job dừng. Khóa truyền qua stdin tới `wrangler secret put`, không chèn vào JS/HTML. URL mới được tạo trong artifact mỗi lần chạy, không cần commit ngược cấu hình bằng Actions. Lấy link Pages đã hoạt động từ kết quả job, không coi địa chỉ dự kiến là website đã chạy.

Nếu triển khai từ máy quản trị, chạy `npx wrangler login`, đặt `CLOUDFLARE_ACCOUNT_ID` trong môi trường Terminal rồi chạy `npm run deploy:worker` với `AI_ENABLED=true`. Có biến môi trường `GEMINI_API_KEY` thì script nạp vào Worker secret. Cloudflare có thể yêu cầu đăng ký subdomain Workers trên dashboard trước. Script không bịa URL nếu chưa có subdomain. Xuất bản lại `site/` sau khi cấu hình được tạo.

Chưa có Gemini API key hợp lệ được cấu hình trong môi trường thực thi lần sửa này. Chưa có cuộc gọi tính phí hoặc deploy production được xác minh. Phần cuối cần kết nối tài khoản/secrets hợp lệ.

## Giới hạn và chi phí

- Câu hỏi 800 ký tự, lịch sử 8 tin nhắn, tối đa 3 đoạn học liệu, đầu ra tối đa 1.024 token.
- Prompt chỉ hỗ trợ tiếng Anh tiểu học, có safetySettings của Gemini và chuyển hướng câu hỏi ngoài phạm vi.
- Timeout 18 giây backend, 20 giây giao diện. SDK cấu hình một lần thử, không tự retry.
- CORS chỉ nhận origin `https://tuannguyen-tkd.github.io`. **CORS không phải xác thực người dùng**; công cụ ngoài trình duyệt có thể giả Origin.
- Rate Limiting và Durable Object bền vững: 6 lượt/phút/IP, 30 lượt/ngày/IP, tổng 150 lượt/ngày. Chỉ lưu mã HMAC IP và số lượt, không IP thô/hội thoại. Ngày tính UTC. Đổi khóa có thể đổi mã IP nhưng tổng giới hạn ngày vẫn ở Durable Object.
- Trường dùng chung IP có thể cùng chia hạn mức. Đây là cấu hình khởi đầu cho thử nghiệm nhỏ, cần điều chỉnh có kiểm soát khi mở rộng.
- Endpoint công khai chưa có đăng nhập riêng từng học sinh/Turnstile. Cần bổ sung cơ chế phù hợp trước mở rộng công khai. Giới hạn lượt không bảo đảm trần tiền tuyệt đối.
- Gemini API và hosting có thể tính phí riêng. Đặt hạn mức/cảnh báo trong tài khoản và theo dõi Usage. Không hứa AI/Worker miễn phí vô hạn.

## Dữ liệu cũ, PDF và offline

Không xóa localStorage cũ, nhưng `file://`, localhost và Pages là các origin khác nhau. Hồ sơ cũ không tự chuyển sang địa chỉ mới. Mỗi thiết bị/trình duyệt vẫn giữ dữ liệu riêng, chưa đồng bộ toàn trường. Sao lưu ở địa chỉ cũ trước khi chuyển; không xóa vùng lưu trình duyệt khi chưa kiểm tra. Bản này không thêm cơ chế tự di chuyển dữ liệu.

8 PDF riêng không có trong tệp HTML nên không nằm trong gói. Bìa và 631 trang OCR được giữ. Có thể chọn PDF trên thiết bị bằng chức năng cũ. Trước khi đưa sách lên Pages công khai, cần có quyền chia sẻ và xem giới hạn kích thước repo.

`OFFLINE_MODE=true` được giữ để API dữ liệu cũ dùng localStorage/học liệu nhúng. Cờ này không phải Service Worker tải sẵn mọi ảnh. Bản đã tách tệp cần ảnh được tải/cached hoặc chạy từ máy chủ tĩnh trên thiết bị. Không tuyên bố toàn bộ Pages dùng được khi mất mạng. Gia sư AI cần Internet.

## Kiểm thử

- **14 kiểm thử Node đạt**: ngân hàng dữ liệu/sidebar, origin, thiếu khóa, role/model giả, dữ liệu riêng tư, SDK Gemini với upstream giả lập, safetySettings, hỏi tiếp, quota bền vững, lỗi 401/429/5xx, timeout, JSON quá dài, câu trả lời bị chặn/cắt ngắn/hỏng định dạng.
- `npm run check` đạt: cú pháp classic script, đường dẫn ảnh, ba nút đã xóa, một transport, không có khóa thật trong mã public.
- `npm run worker:dry-run` đạt với Wrangler 4.155.0, có Rate Limit và SQLite Durable Object. Dry run không phải deploy thật.
- Browser: mở Home, Từ vựng, sáu trò chơi, mười truyện/đọc chậm, popup Luyện nói, Kho sách. Sidebar desktop giữ 218,08 px và cùng cây menu khi chuyển trang. Câu hỏi “pencil nghĩa là gì?” hiển thị riêng và trả học liệu có nhãn rõ.
- Sidebar đã đo trong các khung 1366×768, 1280×600, 390×800 và 844×390: đủ 13 mục, chiều cao scrollHeight bằng clientHeight, không bị cắt nội dung nút. Chưa phải thiết bị thật.
- Chưa kiểm thử mọi thao tác cũ, micro/giọng đọc thật, PDF riêng, toàn bộ chấm điểm hay di chuyển hồ sơ giữa origin. Chưa kiểm thử Gemini thật, tài khoản thanh toán, quyền deploy hoặc URL production.

## Nguồn kỹ thuật đối chiếu 30/10/2026

- https://ai.google.dev/gemini-api/terms
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/deprecations
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
