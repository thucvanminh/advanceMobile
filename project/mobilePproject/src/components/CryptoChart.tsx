import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { COLORS, BINANCE_API_BASE, BINANCE_WS_BASE } from '../utils/constants';

interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  symbol: string;
  interval: string;
  height?: number;
}

// ── Key mới mỗi khi symbol/interval đổi → WebView re-mount ──
export { KlineData };
export default function CryptoChart({ symbol, interval, height = 280 }: Props) {
  // Dùng key = symbol+interval để React unmount/mount lại WebView từ đầu
  return <CryptoChartInner key={`${symbol}-${interval}`} symbol={symbol} interval={interval} height={height} />;
}

const CHART_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f172a;overflow:hidden}
#chart{width:100%;height:100%;position:absolute;top:0;left:0}
</style>
</head>
<body>
<div id="chart"></div>
<script>
window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
var s=document.createElement('script');
s.src='https://unpkg.com/lightweight-charts@5.2.0/dist/lightweight-charts.standalone.production.js';
s.onload=function(){
  try{
    var c=document.getElementById('chart');
    var chart=LightweightCharts.createChart(c,{
      layout:{background:{color:'#0f172a'},textColor:'#94a3b8'},
      grid:{vertLines:{color:'#1e293b'},horzLines:{color:'#1e293b'}},
      crosshair:{mode:LightweightCharts.CrosshairMode.Normal},
      rightPriceScale:{borderColor:'#334155'},
      timeScale:{borderColor:'#334155',timeVisible:true,secondsVisible:false},
      handleScroll:false,handleScale:false,
      width:c.clientWidth,height:c.clientHeight,
    });
    var series=chart.addSeries(LightweightCharts.CandlestickSeries,{
      upColor:'#22c55e',downColor:'#ef4444',
      borderDownColor:'#ef4444',borderUpColor:'#22c55e',
      wickDownColor:'#ef4444',wickUpColor:'#22c55e',
    });
    function handleMsg(e){
      try{
        var d=JSON.parse(e.data);
        if(d.type==='setData'){series.setData(d.klines);chart.timeScale().fitContent();}
        if(d.type==='update'){series.update(d.kline);}
      }catch(_){}
    }
    document.addEventListener('message',handleMsg);
    window.addEventListener('message',handleMsg);
    if(window.ResizeObserver){
      new ResizeObserver(function(){chart.applyOptions({width:c.clientWidth,height:c.clientHeight});}).observe(c);
    }
  }catch(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',msg:e.message}));}
};
s.onerror=function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',msg:'CDN failed'}));};
document.head.appendChild(s);
</script>
</body>
</html>
`;

function CryptoChartInner({ symbol, interval, height }: Props) {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Gửi data xuống WebView
  const postData = useCallback((type: 'setData' | 'update', payload: any) => {
    webviewRef.current?.postMessage(JSON.stringify({ type, ...payload }));
  }, []);

  // Fetch klines lịch sử
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const url = `${BINANCE_API_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`;
        const res = await fetch(url);
        const raw = await res.json();
        if (cancelled || !Array.isArray(raw)) return;

        const klines: KlineData[] = raw.map((k: any[]) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));

        // Đợi WebView ready (tối đa 3s)
        let waited = 0;
        const waitReady = setInterval(() => {
          waited += 200;
          try {
            webviewRef.current?.postMessage(JSON.stringify({ type: 'setData', klines }));
            clearInterval(waitReady);
            setLoading(false);
          } catch (_) {
            if (waited > 3000) { clearInterval(waitReady); setLoading(false); }
          }
        }, 200);
      } catch (e: any) {
        if (!cancelled) { setError(e.message); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [symbol, interval]);

  // WebSocket real-time kline update
  useEffect(() => {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const wsUrl = `${BINANCE_WS_BASE}/${stream}`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (evt) => {
        try {
          const d = JSON.parse(evt.data);
          if (d.e === 'kline' && d.k) {
            const k = d.k;
            let time: number;
            // Kline interval > 1h → dùng close time, else open time
            if (['1h', '4h', '1D'].includes(interval)) {
              time = Math.floor(k.T / 1000); // close time
            } else {
              time = Math.floor(k.t / 1000); // open time
            }
            postData('update', {
              kline: {
                time,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
              },
            });
          }
        } catch (_) {}
      };
      ws.onerror = () => {};
    } catch (_) {}

    wsRef.current = ws;
    return () => { try { ws?.close(); } catch (_) {} };
  }, [symbol, interval, postData]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'error') { setError(msg.msg); setLoading(false); }
    } catch {}
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#3b82f6" size="small" />
          <Text style={styles.loadingText}>Đang tải biểu đồ...</Text>
        </View>
      )}
      {error && !loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <WebView
        ref={webviewRef}
        source={{ html: CHART_HTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  webview: { flex: 1, backgroundColor: COLORS.background },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 12, marginTop: 8 },
  errorText: { color: COLORS.red, fontSize: 12 },
});
