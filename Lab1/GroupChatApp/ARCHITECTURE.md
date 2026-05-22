# Group Chat App - Project Documentation

## 1. Tổng quan dự án

Đây là ứng dụng chat nhóm real-time cho phép nhiều user cùng chat với nhau qua mạng local.

### Công nghệ

| Phần | Công nghệ |
|------|-----------|
| Mobile | React Native (Expo) |
| Server | Node.js + Socket.io |
| Giao tiếp | WebSocket (real-time) |
| Lưu trữ cục bộ | AsyncStorage |

### Sơ đồ kiến trúc

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Mobile    │ ◄─────────────────────────► │   Server    │
│  (React    │    ws://ip:3000              │  (Node.js)  │
│   Native)  │                             │             │
└─────────────┘                             └─────────────┘
       │                                           │
       │ AsyncStorage                              │
       │ (tin nhắn cũ)                            │
       ▼                                           ▼
┌─────────────┐                             ┌─────────────┐
│  Local DB   │                             │   Console   │
│            │                             │   (logs)    │
└─────────────┘                             └─────────────┘
```

---

## 2. Cấu trúc thư mục

```
Lab1/
├── GroupChatApp/           # Ứng dụng React Native
│   ├── screens/            # Các màn hình
│   │   ├── HomeScreen.tsx       # Màn hình nhập tên
│   │   ├── HomeScreenStyles.ts # Styles HomeScreen
│   │   ├── GroupChatScreen.tsx # Màn hình chat
│   │   └── GroupChatScreenStyles.ts
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   └── ...
│
├── server/                # Server Socket.io
│   ├── server.js         # Logic server
│   └── package.json
│
└── SERVER.md              # Tài liệu server
```

---

## 3. Luồng dữ liệu

### 3.1 Đăng nhập

```
User nhập tên
       │
       ▼
Lưu vào AsyncStorage
       │
       ▼
Kết nối Socket.io
       │
       ▼
Gửi 'joinGroup' event
       │
       ▼
Server broadcast tin nhắn system
       │
       ▼
Navigate đến GroupChat
```

### 3.2 Gửi tin nhắn

```
User nhập tin nhắn
       │
       ▼
Bấm nút gửi
       │
       ▼
Emit 'sendMessage' đến server
       │
       ▼
Server broadcast cho tất cả
       │
       ▼
Client nhận 'receiveMessage'
       │
       ▼
Hiển thị trên FlatList
       │
       ▼
Lưu vào AsyncStorage
```

---

## 4. Các thành phần chính

### 4.1 HomeScreen

**Chức năng:** Nhập tên user để bắt đầu chat

**State:**
- `username`: Tên user
- `isLoading`: Trạng thái kết nối

**Logic:**
1. Load username đã lưu từ AsyncStorage
2. Khi bấm Start Chat → kết nối server
3. Sau khi connect → navigate sang GroupChat

### 4.2 GroupChatScreen

**Chức năng:** Hiển thị và gửi tin nhắn

**State:**
- `messageText`: Tin nhắn đang nhập
- `messages`: Danh sách tin nhắn

**Logic:**
1. Load lịch sử chat từ AsyncStorage
2. Lắng nghe `receiveMessage` từ server
3. Gửi tin nhắn qua `socket.emit`
4. Auto scroll đến tin mới nhất

### 4.3 Socket connection

**Ở client:**

```typescript
socket = io('http://IP:3000', {
  transports: ['websocket'],
});
```

** событ:** 
- `connect`: Kết nối thành công
- `connect_error`: Kết nối thất bại
- `receiveMessage`: Nhận tin nhắn mới

---

## 5. Quản lý Socket

### Vấn đề

Socket được tạo ở HomeScreen nhưng không được cleanup khi navigate sang màn hình khác → Memory leak, button loading mãi

### Giải pháp

```typescript
const socketRef = useRef<Socket | null>(null);

useEffect(() => {
  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
}, []);
```

---

## 6. Lưu trữ tin nhắn

### AsyncStorage

```typescript
// Lưu
await AsyncStorage.setItem('chatHistory', JSON.stringify(messages));

// Đọc
const saved = await AsyncStorage.getItem('chatHistory');
if (saved) {
  setMessages(JSON.parse(saved));
}
```

### Cấu trúc tin nhắn

```typescript
interface Message {
  id: string;        // timestamp
  text: string;     // nội dung
  username: string; // người gửi
  isSystem?: boolean; // tin hệ thống
}
```

---

## 7. Navigation

Sử dụng `@react-navigation/native-stack`:

```typescript
type RootStackParamList = {
  Home: undefined;
  GroupChat: { username: string };
};
```

Flow:
```
Home ──────(navigate)──────► GroupChat
  │                               │
  │◄────(goBack)─────────────────┘
  │
  │ (reset state, disconnect socket)
```

---

## 8. Chạy ứng dụng

### Yêu cầu

- Node.js >= 16
- Android Studio (cho emulator)
- Server đang chạy port 3000

### Thứ tự chạy

```bash
# Terminal 1: Server
cd server
node server.js

# Terminal 2: Android Emulator
# Mở AVD Manager trong Android Studio

# Terminal 3: App
cd GroupChatApp
npx react-native start
# Hoặc nếu dùng Expo
npx expo start
```

### Kết nối từ thiết bị khác

1. Tìm IP máy chủ: `ipconfig`
2. Sửa IP trong code:
   - HomeScreen.tsx
   - GroupChatScreen.tsx

```typescript
io('http://192.168.1.100:3000', {...})
```

---

## 9. Debug

### Xem log

```bash
# Server
Xem trực tiếp trên terminal chạy server

# Mobile
adb logcat | findstr "ReactNative"
adb logcat | findstr "socket"

# Metro
Xem trực tiếp trên terminal Metro
```

### Các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|------------|---------|
| ECONNREFUSED | Server chưa chạy | Chạy `node server.js` |
| Connection timeout | Sai IP | Kiểm tra IP trong code |
| Button còn xoay | Socket không disconnect | Thêm cleanup |
| Tin nhắn không hiển thị | Server không broadcast | Kiểm tra `io.emit` |

---

## 10. Mở rộng

### Tính năng có thể thêm

- [ ] Room/Phòng chat riêng
- [ ] Gửi hình ảnh
- [ ] Thông báo người đang gõ
- [ ] Đánh dấu đã đọc
- [ ] Avatar user
- [ ] Emoji reactions
- [ ] Gửi file
- [ ] Authentication
- [ ] Database (MongoDB/PostgreSQL)

### Cấu trúc mở rộng

```typescript
// Room
socket.join('room1');
io.to('room1').emit('message', data);

// Typing
socket.emit('typing');
socket.on('typing', () => {...});
```