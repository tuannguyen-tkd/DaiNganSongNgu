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

Dữ liệu học tập nhúng được so sánh JSON trước/sau, trừ ánh xạ ảnh đổi đường dẫn. Giữ 1.000 từ, 500 mẫu ngữ pháp, 10 truyện và câu hỏi, 500 mẫu giao tiếp, trò chơi, chấm điểm, hồ sơ/localStorage, ghi âm nghe lại trên thiết bị, sách/OCR và tốc độ đọc truyện 0,65/0,85/1. Nhận dạng câu nói đã chuyển sang Gemini API; cơ chế so khớp câu và kịch bản luyện nói vẫn giữ nguyên.

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
| `site/audio-api.js` | Giọng đọc và nhận dạng âm thanh qua Worker |
| `site/public-config.js` | URL công khai, không có khóa |
| `site/assets/` | Ảnh/font đã tách |
| `worker/index.mjs` | API và Durable Object hạn mức |
| `worker/wrangler.jsonc` | Cấu hình Cloudflare, không chứa bí mật |
| `.github/workflows/pages.yml` | Kiểm thử và xuất bản Pages khi push; Worker triển khai từ máy quản trị |
| `source-manifest.json` | Hash nguồn và danh mục ảnh |

## Chạy trên máy

Cài Node.js LTS còn hỗ trợ, tối thiểu 22.9. Trong thư mục dự án:

```sh
npm ci
npm test
npm run check
npm run dev
```

Mở http://localhost:4173 và giữ Terminal chạy. Bản checkout đã có URL Worker công khai trong `site/public-config.js`; tra học liệu vẫn dùng được khi AI lỗi. Cần giữ cả thư mục, không gửi riêng `index.html`. Không nhấp đúp HTML để kỳ vọng có backend. Muốn dựng lại từ nguồn, cài Pillow rồi chạy `python3 tools/split-source.py DUONG_DAN_HTML_GOC`; người sử dụng thông thường không cần chạy bước này.

## Đẩy lên repo

Repo mục tiêu: https://github.com/tuannguyen-tkd/DaiNganSongNgu

Repo trống trước khi đồng bộ bản này. Mã đã được push lên nhánh `main`; Pages được cấu hình dùng GitHub Actions. Kiểm tra URL cuối trước khi coi website đã xuất bản. Thu hồi token đã gửi qua chat và tạo quyền mới qua kênh bí mật phù hợp. Không đặt token vào URL remote hoặc tệp dự án.

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
2. Workflow **Deploy Dai Ngan Song Ngu** kiểm tra mã và xuất bản `site/`. Workflow không nhận khóa Gemini hay Cloudflare.
3. Từ máy quản trị, giữ `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GEMINI_API_KEY` trong môi trường tạm thời và chạy `npm run deploy:worker` với `AI_ENABLED=true`. Script nạp Gemini key trực tiếp qua stdin vào Worker secret, lấy URL workers.dev thực từ Wrangler, kiểm tra `/health` và ghi URL công khai vào `site/public-config.js`.
4. Kiểm tra `site/public-config.js` chỉ chứa URL công khai, rồi commit và push tệp đó. Workflow sẽ xuất bản lại Pages từ mã đã push.

Không đưa Gemini key vào GitHub Actions secrets, Git, URL remote, HTML hay JavaScript phía trình duyệt. Script không bịa URL nếu Cloudflare chưa trả URL thật. Cloudflare có thể yêu cầu đăng ký subdomain Workers trên dashboard trước. Chỉ sử dụng AI với đối tượng phù hợp điều khoản Gemini API; cần xác nhận điều kiện sử dụng trước khi cho học sinh truy cập.

Worker đã triển khai tại `https://dai-ngan-tutor.tkd-studio.workers.dev`; Gemini key đã nạp vào Worker secret, `AI_ENABLED=true`. `/health` xác nhận cấu hình và yêu cầu thử `/api/tutor-chat` đã trả HTTP 200 ở chế độ AI. Website Pages: https://tuannguyen-tkd.github.io/DaiNganSongNgu/. Workflow Pages cho commit `ea1ea92` chạy thành công; cấu hình Worker đã xuất hiện trên website và một câu hỏi thử từ giao diện nhận phản hồi AI.

## Âm thanh qua API

Nút nghe gọi `/api/audio/tts` qua Worker với `gemini-3.8-flash-lite-tts`. Hai lựa chọn trong Cài đặt là giọng nữ English US và English UK lấy từ Gemini Voices API. Nút luyện nói ghi tối đa 9 giây, gửi bản ghi ngắn qua `/api/audio/transcribe` tới `gemini-3.5-transcribe`, dùng bản chép lời để so với câu học như trước. Đây là so khớp văn bản, không phải đánh giá phát âm chi tiết. Các bản ghi chỉ để nghe lại trên máy trong mục luyện nói riêng vẫn giữ tại thiết bị và không gửi lên API.

Worker chỉ chấp nhận Origin của Pages, giới hạn bản ghi dưới 1 MB, áp dụng 12 lượt âm thanh/phút/IP, tối đa 40 lượt/ngày/IP và 100 lượt âm thanh/ngày toàn trang. Hạn mức âm thanh tách khỏi gia sư. Tệp tạm tải lên Gemini Files API được xóa sau khi nhận dạng. Khóa Gemini chỉ ở Worker secret. Âm thanh gửi tới Google để xử lý; Free Tier có hạn mức thực tế theo tài khoản, cần kiểm tra Usage trên AI Studio. Nghe và nhận dạng qua API cần Internet. Không bật micro khi chưa có thao tác và đồng ý trong giao diện.

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

- **17 kiểm thử Node đạt**: các kiểm thử gia sư trước đây cùng ba kiểm thử API âm thanh (giọng nữ, chép lời/xóa tệp tạm, chặn origin và dữ liệu không hợp lệ).
- `npm run check` đạt: cú pháp classic script, đường dẫn ảnh, ba nút đã xóa, một transport, không có khóa thật trong mã public.
- `npm run worker:dry-run` đạt với Wrangler 4.155.0, có Rate Limit và SQLite Durable Object. Worker thật đã triển khai và trả một câu hỏi thử qua Gemini.
- Browser: mở Home, Từ vựng, sáu trò chơi, mười truyện/đọc chậm, popup Luyện nói, Kho sách. Sidebar desktop giữ 218,08 px và cùng cây menu khi chuyển trang. Câu hỏi “pencil nghĩa là gì?” hiển thị riêng và trả học liệu có nhãn rõ.
- Sidebar đã đo trong các khung 1366×768, 1280×600, 390×800 và 844×390: đủ 13 mục, chiều cao scrollHeight bằng clientHeight, không bị cắt nội dung nút. Chưa phải thiết bị thật.
- Đã kiểm tra Gemini thật tạo hai giọng US/UK và chép lại một câu mẫu; Worker production trả HTTP 200 cho hai luồng đó. Chưa thử micro trên thiết bị người dùng, mọi thao tác cũ, PDF riêng, toàn bộ chấm điểm hay di chuyển hồ sơ giữa origin. Chưa kiểm chứng hạn mức thanh toán/chi phí thực tế.

## Nguồn kỹ thuật đối chiếu 30/10/2026

- https://ai.google.dev/gemini-api/terms
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/deprecations
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
