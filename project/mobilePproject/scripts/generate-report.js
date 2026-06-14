/**
 * Generate project report as .docx
 * Usage: node scripts/generate-report.js
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  PageBreak, NumberedReference, LevelFormat,
} = require('docx');

const OUTPUT = path.join(process.env.HOME, 'Dantey/trashes/projectmobile/BaoCao_DoAn_CryptoApp.docx');

// ─── helpers ───
const TITLE_FONT = { font: 'Times New Roman' };
const BODY_FONT = { font: 'Times New Roman', size: 24 }; // 12pt
const CODE_FONT = { font: 'Consolas', size: 20 };
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120, line: 360 },
    ...opts,
    children: [
      new TextRun({
        text,
        ...BODY_FONT,
        bold: opts.bold || false,
        italics: opts.italics || false,
      }),
    ],
  });

const heading = (text, level) =>
  new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
    font: TITLE_FONT,
  });

const bullet = (text, indent = 400) =>
  new Paragraph({
    spacing: { after: 80, line: 320 },
    indent: { left: indent, hanging: 200 },
    children: [new TextRun({ text: '• ' + text, ...BODY_FONT })],
  });

const empty = () => new Paragraph({ spacing: { after: 60 }, children: [] });

// ─── main ───
async function main() {
  const doc = new Document({
    title: 'Báo cáo đồ án Crypto Trading App',
    description: 'Chi tiết đồ án xây dựng ứng dụng giao dịch crypto trên Android',
    styles: { default: { document: { run: BODY_FONT } } },
    sections: [
      // ──────── COVER PAGE ────────
      {
        properties: {},
        children: [
          empty(), empty(), empty(), empty(), empty(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO', ...TITLE_FONT, size: 28, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: 'TRƯỜNG ĐẠI HỌC ...', ...TITLE_FONT, size: 28, bold: true })],
          }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'KHOA ...', ...TITLE_FONT, size: 24 })] }),
          empty(), empty(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            border: { top: { style: 'single', size: 6 }, bottom: { style: 'single', size: 6 } },
            children: [new TextRun({ text: 'BÁO CÁO ĐỒ ÁN', ...TITLE_FONT, size: 36, bold: true })],
          }),
          empty(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: 'XÂY DỰNG ỨNG DỤNG GIAO DỊCH CRYPTO', ...TITLE_FONT, size: 28, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'TRÊN NỀN TẢNG ANDROID', ...TITLE_FONT, size: 28, bold: true })],
          }),
          empty(), empty(), empty(), empty(),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Giảng viên hướng dẫn: .......................', ...BODY_FONT })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Sinh viên thực hiện:  .......................', ...BODY_FONT })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Lớp:  ..............................................', ...BODY_FONT })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Niên khóa:  ........................................', ...BODY_FONT })] }),
          empty(), empty(),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TP. Hồ Chí Minh, 2026', ...BODY_FONT, bold: true })] }),
        ],
      },

      // ──────── CHƯƠNG 1 ────────
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: 'CHƯƠNG 1: GIỚI THIỆU', ...TITLE_FONT, size: 32, bold: true })], spacing: { before: 400, after: 300 }, border: { bottom: { style: 'single', size: 6 } } }),
          heading('1.1. Tổng quan đề tài', HeadingLevel.HEADING_2),
          p('Thị trường tiền mã hóa (cryptocurrency) đã phát triển mạnh mẽ trong những năm gần đây, thu hút hàng triệu nhà đầu tư trên toàn thế giới. Các ứng dụng giao dịch trên thiết bị di động ngày càng trở nên phổ biến nhờ tính tiện lợi và khả năng theo dõi thị trường real-time.'),
          p('Đồ án này nhằm xây dựng một ứng dụng giao dịch crypto trên nền tảng Android, cho phép người dùng thực hành giao dịch với tiền ảo (paper trading) trên cả thị trường Spot (giao ngay) và Futures (hợp đồng tương lai). Ứng dụng được xây dựng bằng React Native, sử dụng Firebase làm backend và Binance API để lấy dữ liệu thị trường real-time.'),
          heading('1.2. Mục tiêu', HeadingLevel.HEADING_2),
          bullet('Xây dựng ứng dụng Android với giao diện thân thiện, dễ sử dụng.'),
          bullet('Tích hợp dữ liệu giá real-time từ Binance WebSocket.'),
          bullet('Cho phép giao dịch demo (paper trading) cả Spot và Futures.'),
          bullet('Hỗ trợ biểu đồ nến real-time, order book, cảnh báo giá.'),
          bullet('Chi phí vận hành bằng 0 (Firebase free tier + Binance API free).'),

          heading('1.3. Phạm vi', HeadingLevel.HEADING_2),
          bullet('Nền tảng: Android (React Native CLI).'),
          bullet('Dữ liệu: Binance public WebSocket & REST API.'),
          bullet('Backend: Firebase Auth + Firestore.'),
          bullet('Giao dịch: Paper trading (demo).'),

          heading('1.4. Công nghệ sử dụng', HeadingLevel.HEADING_2),
          new Table({
            rows: [
              ['Công nghệ', 'Mục đích', 'Phiên bản'].map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, ...BODY_FONT })] })] })),
              ...([
                ['React Native', 'Framework mobile', '0.85'],
                ['TypeScript', 'Ngôn ngữ lập trình', '5.8'],
                ['Firebase Auth', 'Xác thực người dùng', '24.1'],
                ['Firestore', 'CSDL real-time', '24.1'],
                ['Binance WebSocket', 'Dữ liệu giá real-time', '-'],
                ['lightweight-charts', 'Thư viện vẽ biểu đồ', '5.2'],
                ['react-native-webview', 'Embed Web chart', '-'],
                ['notifee', 'Local notification', '-'],
                ['crypto-js', 'HMAC-SHA256', '4.2'],
              ]).map(row => row.map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, ...BODY_FONT })] })] }))),
            ].map(rowData => new TableRow({ children: rowData })),
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          empty(),
        ],
      },

      // ──────── CHƯƠNG 2 ────────
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: 'CHƯƠNG 2: CƠ SỞ LÝ THUYẾT', ...TITLE_FONT, size: 32, bold: true })], spacing: { before: 400, after: 300 }, border: { bottom: { style: 'single', size: 6 } } }),
          heading('2.1. React Native', HeadingLevel.HEADING_2),
          p('React Native là framework mã nguồn mở do Meta phát triển, cho phép xây dựng ứng dụng di động đa nền tảng bằng JavaScript/TypeScript. React Native sử dụng kiến trúc component-based, cho phép tái sử dụng code giữa Android và iOS thông qua cơ chế bridge kết nối JavaScript với native modules.'),
          p('Trong đồ án này, React Native được chọn vì khả năng phát triển nhanh, cộng đồng lớn, và hệ sinh thái thư viện phong phú. Các khái niệm quan trọng sử dụng trong dự án:'),
          bullet('Components: View, Text, TouchableOpacity, FlatList, ScrollView, Modal.'),
          bullet('State management: React Context API cho AuthContext, PriceContext.'),
          bullet('Hooks: useState, useEffect, useCallback, useMemo, useReducer.'),
          bullet('Navigation: @react-navigation/native-stack (AuthStack + MainStack).'),
          bullet('StyleSheet: Tạo giao diện tối (dark theme) với các màu sắc đồng bộ.'),
          heading('2.2. Firebase', HeadingLevel.HEADING_2),
          p('Firebase là nền tảng phát triển ứng dụng của Google, cung cấp nhiều dịch vụ backend như xác thực, cơ sở dữ liệu, lưu trữ. Đồ án sử dụng các dịch vụ sau:'),
          bullet('Firebase Authentication: Hỗ trợ đăng ký/đăng nhập bằng email và password. Firebase Auth quản lý session, tự động refresh token.'),
          bullet('Cloud Firestore: Cơ sở dữ liệu NoSQL dạng document-collection, hỗ trợ real-time snapshot listener. Dữ liệu được đồng bộ theo thời gian thực giữa các client.'),
          bullet('Security Rules: Kiểm soát quyền truy cập dữ liệu, đảm bảo user chỉ đọc/ghi data của chính họ.'),
          p('Firestore được chọn vì khả năng real-time, dễ sử dụng, và free tier hào phóng (1GB lưu trữ, 10K writes/tháng) — đủ cho ứng dụng với vài người dùng.'),
          heading('2.3. Binance API', HeadingLevel.HEADING_2),
          p('Binance cung cấp API public miễn phí cho dữ liệu thị trường. Đồ án sử dụng hai loại kết nối:'),
          p('WebSocket Streams: Kết nối persistent, push dữ liệu real-time. Các stream được sử dụng:', true),
          bullet('@trade: Giá giao dịch real-time (ms). Dùng cho Dashboard.'),
          bullet('@kline_1m/5m/15m/1h/4h/1D: Dữ liệu nến các khung giờ. Dùng cho Chart.'),
          bullet('@depth: Order book depth. Dùng cho DetailScreen.'),
          p('REST API: Gọi HTTP request để lấy dữ liệu lịch sử và dữ liệu 24h:', true),
          bullet('/api/v3/klines: Lịch sử nến (dùng khi load chart lần đầu).'),
          bullet('/api/v3/ticker/24hr: Thống kê 24h.'),
          bullet('/api/v3/depth: Order book.'),
          p('Đối với giao dịch Futures thật, API signed request sử dụng HMAC-SHA256 để ký mỗi request với API Secret.'),
          heading('2.4. Thị trường giao dịch', HeadingLevel.HEADING_2),
          p('Spot (giao ngay): Mua/bán tài sản thực tế. Khi mua BTC, user thực sự sở hữu BTC. Khi bán, user phải có BTC để bán. Giá trị = số lượng × giá hiện tại.'),
          p('Futures (hợp đồng tương lai): Giao dịch dựa trên biến động giá, không cần sở hữu tài sản. User đặt cọc một khoản ký quỹ (margin), sử dụng đòn bẩy (leverage) để nhân vị thế. Long: lời khi giá tăng. Short: lời khi giá giảm.'),
          p('Các khái niệm quan trọng trong Futures:', true),
          bullet('Leverage (đòn bẩy): Nhân lợi nhuận/thua lỗ. Ví dụ 10x: giá biến động 1% → P&L 10%.'),
          bullet('Margin (ký quỹ): Số tiền đặt cọc = giá trị vị thế / leverage.'),
          bullet('Liquidation (thanh lý): Khi giá chạm ngưỡng, vị thế tự động đóng, mất margin.'),
          bullet('P&L (Profit & Loss): Lợi nhuận = (giá đóng - giá mở) × số lượng × hướng × leverage.'),
        ],
      },

      // ──────── CHƯƠNG 3 ────────
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: 'CHƯƠNG 3: PHÂN TÍCH & THIẾT KẾ', ...TITLE_FONT, size: 32, bold: true })], spacing: { before: 400, after: 300 }, border: { bottom: { style: 'single', size: 6 } } }),
          heading('3.1. Yêu cầu chức năng', HeadingLevel.HEADING_2),
          new Table({
            rows: [
              ['STT', 'Màn hình', 'Chức năng'].map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, ...BODY_FONT })] })] })),
              ...[
                ['1', 'Login / Sign Up', 'Đăng nhập, đăng ký email/password'],
                ['2', 'Dashboard', 'Bảng giá real-time, tìm kiếm coin, balance'],
                ['3', 'Trade (Spot)', 'Mua/bán Spot với giá thị trường'],
                ['4', 'Trade (Futures)', 'Long/Short, chọn leverage, liquidation'],
                ['5', 'Portfolio', 'Danh mục holdings, vị thế futures, lịch sử'],
                ['6', 'Detail', 'Chart nến, 24h stats, order book'],
                ['7', 'Alerts', 'Tạo/xóa cảnh báo giá, push notification'],
                ['8', 'Notifications', 'Danh sách thông báo'],
                ['9', 'Settings', 'Đổi mật khẩu, thông tin user, logout'],
                ['10', 'Admin Panel', 'Danh sách user (chỉ admin)'],
                ['11', 'Help / About', 'FAQ, thông tin ứng dụng'],
              ].map(row => row.map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, ...BODY_FONT })] })] }))),
            ].map(rowData => new TableRow({ children: rowData })),
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          empty(),
          heading('3.2. Kiến trúc hệ thống', HeadingLevel.HEADING_2),
          p('Ứng dụng sử dụng kiến trúc 3 lớp: Presentation Layer (React Native screens + components), Service Layer (Firebase + Binance API), Data Layer (Firestore + WebSocket streams).'),
          p('Luồng dữ liệu chính:', true),
          bullet('Giá real-time: Binance WebSocket → PriceContext → Screens.'),
          bullet('Xác thực: Firebase Auth → AuthContext → Navigation.'),
          bullet('Giao dịch: TradeScreen → useOrders/usePositions → Firestore → UI update (real-time snapshot).'),
          bullet('Alert: useAlerts (poll 10s) → Firestore → notifee notification.'),
          heading('3.3. Thiết kế Database', HeadingLevel.HEADING_2),
          p('Firestore collections:'),
          bullet('users/{userId}: email, displayName, role, settings, paperBalance.'),
          bullet('orders/{orderId}: userId, symbol, side, type, quantity, price, status, mode.'),
          bullet('transactions/{txId}: userId, symbol, amount, price, total, balanceBefore, balanceAfter.'),
          bullet('alerts/{alertId}: userId, symbol, type, value, status.'),
          bullet('notifications/{notifId}: userId, type, title, body, read.'),
          bullet('positions/{positionId}: userId, symbol, side, quantity, entryPrice, leverage, liquidationPrice, marginUsed, status.'),
          bullet('symbols/{symbol}: symbol, baseAsset, price, change24h.'),
          p('Các composite index được tạo: orders(userId+createdAt), orders(userId+status+createdAt), positions(userId+openedAt), notifications(userId+read+createdAt).'),
          heading('3.4. Thiết kế giao diện', HeadingLevel.HEADING_2),
          p('Giao diện sử dụng dark theme (nền #0f172a, surface #1e293b). Mỗi màn hình có layout riêng biệt với các component được tái sử dụng: SymbolCard, CryptoChart, format utilities. Navigation sử dụng Stack Navigator với custom header style.'),
          heading('3.5. Thiết kế bảo mật', HeadingLevel.HEADING_2),
          bullet('Firebase Security Rules: Mỗi user chỉ đọc/ghi document có userId trùng với UID của họ. Admin có quyền đọc tất cả.'),
          bullet('API Key: Không lưu trên server hay Firebase. Chỉ lưu trên thiết bị (AsyncStorage/Keychain). KHÔNG gửi lên Firestore.'),
          bullet('Xác thực: Firebase Auth tự động quản lý token, refresh token.'),
        ],
      },

      // ──────── CHƯƠNG 4 ────────
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: 'CHƯƠNG 4: CÀI ĐẶT & TRIỂN KHAI', ...TITLE_FONT, size: 32, bold: true })], spacing: { before: 400, after: 300 }, border: { bottom: { style: 'single', size: 6 } } }),
          heading('4.1. Môi trường phát triển', HeadingLevel.HEADING_2),
          p('Dự án được phát triển trên Ubuntu Linux với Android Studio (emulator Pixel 5 API 34), Node.js 24, React Native CLI. Môi trường được cài đặt với các công cụ:'),
          bullet('React Native 0.85.3 với TypeScript.'),
          bullet('Android SDK 36, build tools 36.0.0.'),
          bullet('Firebase CLI + Admin SDK cho deploy indexes và rules.'),
          bullet('Các package chính: @react-native-firebase/app, @react-navigation/native, lightweight-charts, @notifee/react-native.'),
          heading('4.2. Cài đặt Firebase', HeadingLevel.HEADING_2),
          p('Project Firebase "cryptotradingdemo" được tạo với Android package com.mobilepproject. Các bước tích hợp:'),
          bullet('Tạo Android app trong Firebase Console, download google-services.json.'),
          bullet('Copy vào android/app/, thêm classpath "com.google.gms:google-services:4.4.2" vào build.gradle.'),
          bullet('Cài đặt @react-native-firebase/app, @react-native-firebase/auth, @react-native-firebase/firestore.'),
          bullet('Bật Authentication (Email/Password) và Firestore (test mode).'),
          bullet('Tạo indexes bằng script sử dụng Admin SDK + REST API.'),
          bullet('Deploy security rules qua Firebase Rules REST API.'),
          heading('4.3. Cài đặt Authentication', HeadingLevel.HEADING_2),
          p('AuthContext sử dụng React Context + useReducer để quản lý state authentication. Luồng hoạt động:'),
          bullet('onAuthStateChanged listener → set current user.'),
          bullet('Khi user đăng nhập: Firestore onSnapshot lắng nghe user document real-time (kể cả balance thay đổi).'),
          bullet('Khi user đăng xuất: clear state, unsubscribe snapshot.'),
          bullet('Đổi mật khẩu: dùng reauthenticateWithCredential (EmailAuthProvider) + updatePassword.'),
          heading('4.4. Cài đặt Real-time Price', HeadingLevel.HEADING_2),
          p('BinanceWebSocketService: Singleton quản lý kết nối WebSocket đến Binance với các tính năng:'),
          bullet('Tự động kết nối đến stream @trade cho 10 cặp tiền.'),
          bullet('Auto-reconnect với exponential backoff (1s → 2s → 4s → 8s → max 30s, tối đa 10 lần).'),
          bullet('Callback pattern: onPriceUpdate, onTickerUpdate cho phép multiple subscribers.'),
          bullet('App lifecycle management: ngắt WebSocket khi app vào background, kết nối lại khi foreground.'),
          bullet('PriceContext: lưu giá mới nhất trong state, cung cấp getPrice/getChange24h cho các screen.'),
          heading('4.5. Cài đặt Chart', HeadingLevel.HEADING_2),
          p('Chart sử dụng lightweight-charts (TradingView) chạy trong WebView. Cách hoạt động:'),
          bullet('CryptoChart component render WebView với HTML inline.'),
          bullet('WebView load thư viện lightweight-charts từ CDN (async).'),
          bullet('React Native fetch dữ liệu klines từ Binance API, gửi xuống WebView qua postMessage.'),
          bullet('WebSocket kết nối đến stream @kline_1m/5m/15m/1h/4h/1D để cập nhật nến real-time.'),
          bullet('Khi đổi khung thời gian, component re-mount với key mới (key={symbol}-{interval}).'),
          heading('4.6. Cài đặt Spot Trading', HeadingLevel.HEADING_2),
          p('Paper Spot trading:'),
          bullet('User nhập số lượng (coin) hoặc số tiền (USDT).'),
          bullet('Order được tạo trong Firestore với status "filled".'),
          bullet('Số dư user (USDT, coin) được cập nhật real-time qua Firestore snapshot.'),
          bullet('User có thể nhập theo Quantity hoặc USDT (toggle BTC/USDT).'),
          heading('4.7. Cài đặt Futures Trading', HeadingLevel.HEADING_2),
          p('Paper Futures trading:'),
          bullet('User nhập margin (USDT), chọn leverage (1x-100x).'),
          bullet('Position value = margin × leverage. Quantity = position value / current price.'),
          bullet('Liquidation price: simplified calculation dựa trên entry price và leverage.'),
          bullet('P&L real-time: (markPrice - entryPrice) × quantity × direction × leverage.'),
          bullet('Vị thế được lưu trong collection positions. Đóng vị thế → trả margin + P&L về balance.'),
          heading('4.8. Cài đặt Alert & Notification', HeadingLevel.HEADING_2),
          bullet('Alert được lưu trong Firestore collection alerts.'),
          bullet('Hook useAlerts chạy interval 10 giây, kiểm tra giá hiện tại vs ngưỡng alert.'),
          bullet('Khi trigger: update status "triggered", tạo notification document, gửi local push notification qua notifee.'),
          bullet('Local notification hiển thị ngay cả khi app đang foreground.'),
          heading('4.9. Các màn hình khác', HeadingLevel.HEADING_2),
          bullet('Order Book: Fetch /api/v3/depth, hiển thị 5 bids + 5 asks.'),
          bullet('Symbol Picker: Modal với search bar + filtered FlatList.'),
          bullet('Admin Panel: Chỉ admin mới thấy, hiển thị danh sách user từ Firestore.'),
          bullet('Help/About: FAQ accordion, version, developer info.'),
        ],
      },

      // ──────── CHƯƠNG 5 ────────
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: 'CHƯƠNG 5: KIỂM THỬ', ...TITLE_FONT, size: 32, bold: true })], spacing: { before: 400, after: 300 }, border: { bottom: { style: 'single', size: 6 } } }),
          new Table({
            rows: [
              ['STT', 'Kịch bản', 'Kết quả mong đợi', 'Kết quả thực tế'].map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, ...BODY_FONT })] })] })),
              ...[
                ['1', 'Đăng ký tài khoản mới', 'Tạo user thành công, balance 10000 USDT', '✅'],
                ['2', 'Đăng nhập với tài khoản đã có', 'Vào Dashboard, thấy balance', '✅'],
                ['3', 'Dashboard hiển thị giá', 'Giá 10 cặp tiền cập nhật real-time', '✅'],
                ['4', 'Search coin trên Dashboard', 'Lọc danh sách theo text', '✅'],
                ['5', 'Mua Spot BTC', 'Balance cập nhật, portfolio hiển thị BTC', '✅'],
                ['6', 'Bán Spot BTC', 'Balance USDT tăng, BTC giảm', '✅'],
                ['7', 'Mở Long BTC 10x', 'Position xuất hiện trong tab Vị thế', '✅'],
                ['8', 'Mở Short ETH 5x', 'Position Short hiển thị', '✅'],
                ['9', 'Đóng vị thế', 'Position biến mất, balance cập nhật', '✅'],
                ['10', 'Xem chart (các khung giờ)', 'Chart hiển thị nến đúng khung', '✅'],
                ['11', 'Tạo alert', 'Alert hiển thị trong danh sách', '✅'],
                ['12', 'Trigger alert', 'Notification xuất hiện', '✅'],
                ['13', 'Admin panel', 'Chỉ admin xem được danh sách user', '✅'],
                ['14', 'Đổi mật khẩu', 'Yêu cầu mật khẩu cũ, cập nhật thành công', '✅'],
              ].map(row => row.map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, ...BODY_FONT })] })] }))),
            ].map(rowData => new TableRow({ children: rowData })),
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          empty(),
          p('Kết quả: Tất cả các kịch bản kiểm thử đều hoạt động đúng như mong đợi. Giá real-time đồng bộ với TradingView.'),
        ],
      },

      // ──────── CHƯƠNG 6 ────────
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: 'CHƯƠNG 6: KẾT LUẬN', ...TITLE_FONT, size: 32, bold: true })], spacing: { before: 400, after: 300 }, border: { bottom: { style: 'single', size: 6 } } }),
          heading('6.1. Kết quả đạt được', HeadingLevel.HEADING_2),
          bullet('Xây dựng thành công ứng dụng Android với 10+ màn hình.'),
          bullet('Tích hợp dữ liệu giá real-time từ Binance WebSocket.'),
          bullet('Giao dịch Spot + Futures với paper trading.'),
          bullet('Biểu đồ nến real-time, order book, 24h stats.'),
          bullet('Hệ thống cảnh báo giá với local notification.'),
          bullet('Phân quyền admin/user.'),
          bullet('Chi phí vận hành $0 (Firebase free tier + Binance free API).'),
          heading('6.2. Hạn chế', HeadingLevel.HEADING_2),
          bullet('Giao dịch demo (paper), chưa kết nối sàn thật.'),
          bullet('Chart đơn giản (chưa hỗ trợ indicators, vẽ tay).'),
          bullet('Chưa hỗ trợ limit order, stop-loss, take-profit.'),
          bullet('Chỉ hỗ trợ Android, chưa có iOS.'),
          heading('6.3. Hướng phát triển', HeadingLevel.HEADING_2),
          bullet('Real trading: Kết nối Binance API signed với API Key của user.'),
          bullet('Nâng cao chart: Thêm indicators (RSI, MACD, MA), vẽ đường trend, drawing tools.'),
          bullet('Thêm loại lệnh: Limit, Stop-Limit, OCO, Trailing Stop.'),
          bullet('Chế độ margin: Cross-margin, Isolated margin cho Futures.'),
          bullet('Đa ngôn ngữ: Tiếng Anh, hỗ trợ thêm ngôn ngữ khác.'),
          bullet('Deploy lên Google Play Store (phí $25 một lần).'),
          empty(),
          p('Đồ án đã hoàn thành các mục tiêu đề ra, cung cấp một nền tảng vững chắc để phát triển thành ứng dụng giao dịch thực tế.', { bold: true }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, buffer);
  console.log('✅ Report generated:', OUTPUT);
}

main().catch(e => { console.error(e); process.exit(1); });
