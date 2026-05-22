# Group Chat App - Hướng dẫn nhanh

## Cài đặt

### Yêu cầu

- Node.js >= 16
- Java JDK 11+
- Android Studio (cho Android)
- Xcode (cho iOS - Mac only)

### Cài đặt dependencies

```bash
# Server
cd server
npm install

# App
cd GroupChatApp
npm install
```

---

## Chạy ứng dụng

### Bước 1: Chạy Server

```bash
cd server
node server.js
```

Server chạy ở **http://localhost:3000**

### Bước 2: Chạy Android Emulator

```bash
# Mở Android Studio
# Vào AVD Manager
# Chọn thiết bị ảo và bấm Play
```

Hoặc dùng command line:

```bash
# Liệt kê thiết bị
emulator -list-avds

# Chạy emulator
emulator -avd <ten-thiet-bi>
```

### Bước 3: Chạy App

```bash
cd GroupChatApp

# React Native CLI
npx react-native start
# Terminal khác:
npx react-native run-android

# Expo
npx expo start
# Bấm 'a' để chạy trên Android
```

---

## Sử dụng

### Màn hình Home

1. Nhập tên của bạn
2. Bấm "Start Chat"
3. Chờ kết nối server

### Màn hình Chat

1. Nhập tin nhắn
2. Bấm nút gửi (➤)
3. Tin nhắn sẽ hiển thị cho tất cả user

### Thoát

Bấm nút Back để quay về màn hình nhập tên

---

## Cấu hình IP

Để các thiết bị khác truy cập được:

1. Tìm IP máy:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Tìm dòng **IPv4 Address** (vd: 192.168.1.100)

3. Sửa file `GroupChatApp/screens/HomeScreen.tsx`:
   ```typescript
   // Thay
   io('http://10.60.249.11:3000', {...})
   // thành
   io('http://192.168.1.100:3000', {...})
   ```

4. Sửa tương tự trong `GroupChatApp/screens/GroupChatScreen.tsx`

---

## Xem log

### Log Server

Xem trực tiếp trên terminal đang chạy `node server.js`

### Log Mobile

```bash
adb logcat
```

Lọc log React Native:
```bash
adb logcat | findstr "ReactNative"
```

Lọc log Socket:
```bash
adb logcat | findstr "socket"
```

### Log Metro Bundler

Xem trực tiếp trên terminal đang chạy `npx react-native start`

---

## Các lỗi thường gặp

### ❌ Cannot connect to server

| Nguyên nhân | Cách fix |
|------------|---------|
| Server chưa chạy | Chạy `node server.js` |
| Sai IP | Kiểm tra IP trong code |
| Firewall chặn | Tắt Windows Firewall |

### ❌ App không hiển thị trên emulator

```bash
# Reload JS
adb shell input keyevent 82
# Chọn "Reload"

# Hoặc
npx react-native start --reset-cache
```

### ❌ Button vẫn xoay sau khi back

Đã được fix trong phiên bản mới. Nếu gặp, reload app.

### ❌ Tin nhắn không gửi được

Kiểm tra server đang chạy và kết nối cùng WiFi.

---

## Lệnh hữu ích

```bash
# Kill process đang dùng port 3000
netstat -ano | findstr ":3000"
taskkill /PID <pid> /F

# Kill Metro Bundler
npx react-native start --reset-cache

# Clear cache
cd GroupChatApp
npx react-native start --reset-cache
rm -rf node_modules/.cache
```

---

## Cài đặt trên thiết bị thật (USB)

1. Bật Developer Options:
   - Settings → About Phone → Build Number (bấm 7 lần)

2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging

3. Kết nối USB và chấp nhận fingerprint

4. Cài đặt:
   ```bash
   npx react-native run-android
   ```

---

## Cài đặt qua WiFi (không cần USB)

```bash
# Trên máy
adb tcpip 5555

# Lấy IP của máy
adb shell ip addr show wlan0

# Trên điện thoại (terminal mới)
adb connect <ip-may>:5555

# Gỡ USB và dùng qua WiFi
```

---

## Thông tin thêm

Xem chi tiết: [ARCHITECTURE.md](./ARCHITECTURE.md)

Xem tài liệu server: [../server/SERVER.md](../server/SERVER.md)