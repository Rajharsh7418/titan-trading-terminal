require('dotenv').config();
const fs = require('fs');
const ccxt = require('ccxt');
const TelegramBot = require('node-telegram-bot-api');
const { EMA, RSI, MACD, ADX, ATR, VWAP } = require('technicalindicators');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const exchange = new ccxt.binance({ enableRateLimit: true, options: { defaultType: 'future' } });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- THE GHOST FUND (FUTURES SIMULATOR) ---
const FUND_FILE = './ghost_fund.json';
if (!fs.existsSync(FUND_FILE)) fs.writeFileSync(FUND_FILE, JSON.stringify({ balance: 10000.00, openTrades: {} }, null, 2));
function getFund() { return JSON.parse(fs.readFileSync(FUND_FILE)); }
function saveFund(data) { fs.writeFileSync(FUND_FILE, JSON.stringify(data, null, 2)); }

// --- THE OMNI-SCANNER MENU ---
const inlineMenu = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "👑 God Mode Dash", callback_data: '/dash_help' }, { text: "🤖 AI Analysis", callback_data: '/help_claw' }],
            [{ text: "🧮 Quant Math", callback_data: '/quant_help' }, { text: "🔎 On-Chain X-Ray", callback_data: '/help_scan' }],
            [{ text: "🧱 Sniper Walls", callback_data: '/help_wall' }, { text: "👑 Top Whales", callback_data: '/help_top' }],
            [{ text: "🧹 Sweep Sniper", callback_data: '/sweep' }, { text: "🌊 OI Tracker", callback_data: '/help_oi' }],
            [{ text: "🗜️ Vol Squeeze", callback_data: '/squeeze' }, { text: "🗣️ Social Hype", callback_data: '/hype' }],
            [{ text: "📈 RSI Div", callback_data: '/div' }, { text: "🔥 Rekt Heatmap", callback_data: '/rekt' }],
            [{ text: "🧭 Fear & Greed", callback_data: '/fng' }, { text: "🚀 Top Trending", callback_data: '/hot' }],
            [{ text: "🛡️ Trailing Stop", callback_data: '/trail_help' }, { text: "🏦 Paper Portfolio", callback_data: '/portfolio' }]
        ]
    }
};

bot.onText(/\/start/, (msg) => bot.sendMessage(msg.chat.id, "🤖 **TITAN TRADING TERMINAL [V8.0 IMMORTAL]**\nAll systems running natively. Select a tool or type `/help`:", Object.assign({ parse_mode: 'Markdown' }, inlineMenu)));

async function runHelp(chatId) {
    const helpText = `📖 **MASTER GUIDE** 📖\n\n🔍 **SMART MONEY**\n• /sweep (Liquidity Sweeps)\n• /toptraders SOL (Whale L/S)\n• /fvg SOL (Fair Value Gaps)\n• /oi DOGE (Open Interest)\n• /decouple (Alts ignoring BTC)\n• /funding (Short Squeeze)\n\n🎯 **TRADE & AI**\n• /claw BTC (OpenClaw AI)\n• /setup BTC 15m (MTF VWAP)\n• /backtest BTC 15m (Simulator)\n• /predict ETH (Confluence)\n• /quant SOL (Mathematical Edge)\n• /dash SOL (God Mode Terminal)\n• /dca [Entry] [SL] (DCA Zones)\n• /risk [Cap$] [Risk%] [Entry] [SL]\n\n📊 **SCANNERS**\n• /hunt (Fast Movers)\n• /whale (Volume Spikes)\n• /div (RSI Divergence)\n• /rekt (Heatmap)\n• /wall BTC (Order Book)\n• /ls SOL (Retail L/S)\n• /fib SOL (Golden Pocket)\n• /squeeze (Bollinger Pinch)\n• /scan [CA] (DexScreener)\n• /hype (CryptoPanic Hype)\n• /hot (CoinGecko Trending)\n• /fng (Fear & Greed Index)\n• /morning (News Briefing)\n\n🏦 **GHOST FUND**\n• /paper BUY SOL 500 25\n• /portfolio\n• /close SOL\n• /trail SOL (Chandelier Exit)\n\n⚡ **ALERTS**\n• /startalerts SOL PEPE\n• /stopalerts\n• /testkeys (API Diagnostic)`;
    bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
}

// --- CORE MATH ENGINE ---
async function analyzeTimeframe(symbol, tf, limit = 100) {
    try {
        const ohlcv = await exchange.fetchOHLCV(symbol, tf, undefined, limit);
        const closes = ohlcv.map(c => Number(c[4])); const highs = ohlcv.map(c => Number(c[2]));
        const lows = ohlcv.map(c => Number(c[3])); const volumes = ohlcv.map(c => Number(c[5]));
        
        const shortEMA = EMA.calculate({ period: 9, values: closes });
        const longEMA = EMA.calculate({ period: 21, values: closes });
        const rsiValues = RSI.calculate({ period: 14, values: closes });
        const atrValues = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
        const adxValues = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 });
        const vwapValues = VWAP.calculate({ high: highs, low: lows, close: closes, volume: volumes });
        const macdValues = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
        
        const avgVolume = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
        return {
            trend: shortEMA[shortEMA.length - 1] > longEMA[longEMA.length - 1] ? 'LONG 🟢' : 'SHORT 🔴',
            rsi: rsiValues[rsiValues.length - 1], atr: atrValues[atrValues.length - 1] || 0,
            adx: adxValues[adxValues.length - 1]?.adx || 0, vwap: vwapValues[vwapValues.length - 1] || closes[closes.length-1],
            macdHist: macdValues[macdValues.length - 1]?.histogram || 0,
            volSurge: volumes[volumes.length - 1] > (avgVolume * 1.2), ohlcv: ohlcv
        };
    } catch (e) { return null; }
}
// --- OPENCLAW AI BRIDGE ---
async function runClaw(chatId, symbol) {
    const waitMsg = await bot.sendMessage(chatId, `🤖 **OPENCLAW AGENT**\nExtracting data for ${symbol}...`, { parse_mode: 'Markdown' });
    try {
        const ticker = await exchange.fetchTicker(symbol);
        const d15m = await analyzeTimeframe(symbol, '15m'); const d1h = await analyzeTimeframe(symbol, '1h');
        if (!d15m || !d1h) return bot.editMessageText("⚠️ Binance data missing.", { chat_id: chatId, message_id: waitMsg.message_id });

        const ob = await exchange.fetchOrderBook(symbol, 50);
        const maxBid = ob.bids.reduce((max, bid) => bid[1] > max[1] ? bid : max, [0, 0]);
        const maxAsk = ob.asks.reduce((max, ask) => ask[1] > max[1] ? ask : max, [0, 0]);

        const prompt = `Act as a quantitative data parser. Review this raw technical data for ${symbol} and provide a strictly objective, academic market overview.
        Current Price: $${ticker.last} | 15m Trend: ${d15m.trend.replace('🟢','').replace('🔴','')} (ADX: ${d15m.adx.toFixed(1)}) | 1h Trend: ${d1h.trend.replace('🟢','').replace('🔴','')}
        VWAP: $${d15m.vwap.toFixed(4)} | RSI: ${d15m.rsi.toFixed(1)} | Supp Wall: $${maxBid[0]} | Res Wall: $${maxAsk[0]}
        Write a concise, 2-paragraph technical summary. Do not give financial advice or predict the future. Just analyze the current mathematical buying/selling pressure and where the liquidity sits.`;

        const response = await axios.post('http://127.0.0.1:18789/v1/chat/completions', {
            model: "openclaw:main", messages: [{ role: "user", content: prompt }]
        }, { headers: { 'Authorization': 'Bearer local-dev-token', 'Content-Type': 'application/json' } });

        bot.editMessageText(`🧠 **OPENCLAW ANALYSIS: ${symbol}**\n\n${response.data.choices[0].message.content}`, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
    } catch (e) { bot.editMessageText(`⚠️ OpenClaw Error: ${e.message}`, { chat_id: chatId, message_id: waitMsg.message_id }); }
}

// --- MTF SHIELDED SETUP (WITH 1-CLICK DEMO) ---
async function runSetup(chatId, symbol, tf) {
    const waitMsg = await bot.sendMessage(chatId, `🛡️ Running MTF-Shielded setup for ${symbol}...`);
    try {
        const ticker = await exchange.fetchTicker(symbol); const price = ticker.last; 
        const d = await analyzeTimeframe(symbol, tf); const mtf = await analyzeTimeframe(symbol, '1h');
        
        if (!d || !mtf) return bot.editMessageText("⚠️ Data error.", { chat_id: chatId, message_id: waitMsg.message_id });
        if (d.adx < 25) return bot.editMessageText(`🚫 **REJECTED: Choppy market.** (ADX: ${d.adx.toFixed(1)})`, { chat_id: chatId, message_id: waitMsg.message_id });
        if (d.trend === 'LONG 🟢' && price < d.vwap) return bot.editMessageText(`🚫 **REJECTED: Below VWAP.**`, { chat_id: chatId, message_id: waitMsg.message_id });
        if (d.trend === 'SHORT 🔴' && price > d.vwap) return bot.editMessageText(`🚫 **REJECTED: Above VWAP.**`, { chat_id: chatId, message_id: waitMsg.message_id });
        if (!d.volSurge) return bot.editMessageText(`🚫 **REJECTED: Low Volume Fakeout.**`, { chat_id: chatId, message_id: waitMsg.message_id });
        if (d.trend === 'LONG 🟢' && d.macdHist < 0) return bot.editMessageText(`🚫 **REJECTED: Momentum Dying.**`, { chat_id: chatId, message_id: waitMsg.message_id });
        if (d.trend === 'SHORT 🔴' && d.macdHist > 0) return bot.editMessageText(`🚫 **REJECTED: Momentum Dying.**`, { chat_id: chatId, message_id: waitMsg.message_id });

        let mtfWarning = (mtf && d.trend !== mtf.trend) ? `\n⚠️ **WARNING:** 1H Trend is ${mtf.trend}. High risk!` : `\n✅ **MTF ALIGNED**`;
        const v = d.atr > 0 ? d.atr : (price * 0.02);
        const sl = d.trend === 'LONG 🟢' ? price - (v * 1.5) : price + (v * 1.5);
        
        const tradeDir = d.trend.includes('LONG') ? 'BUY' : 'SELL';
        const coinCode = symbol.replace('/USDT', '');
        const uiOptions = {
            chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: `👻 1-Click Paper Trade ($500 at 10x)`, callback_data: `/autodemo_${tradeDir}_${coinCode}` }]] }
        };

        bot.editMessageText(`🎯 **APPROVED: ${symbol}**\n💵 **Price:** $${price}\n${mtfWarning}\n\n⚙️ **PLAN (1:2):**\n• Action: **${d.trend}**\n• Entry: $${price}\n• TP: $${(d.trend === 'LONG 🟢' ? price + (v*3) : price - (v*3)).toFixed(4)}\n• SL: $${sl.toFixed(4)}`, uiOptions);
    } catch (e) { bot.editMessageText("⚠️ Setup Error.", { chat_id: chatId, message_id: waitMsg.message_id }); }
}

async function runPredict(chatId, symbol) {
    try {
        const ticker = await exchange.fetchTicker(symbol);
        let conf = ''; let up = 0; let down = 0;
        for (const tf of ['5m', '15m', '1h', '4h']) {
            const data = await analyzeTimeframe(symbol, tf);
            if (data) { conf += `**${tf}:** ${data.trend} | `; if (data.trend.includes('LONG')) up++; else down++; }
        }
        bot.sendMessage(chatId, `📊 **CONFLUENCE: ${symbol}**\n💵 **Price:** $${ticker.last}\n⏱️ ${conf.slice(0, -3)}\n🧠 **VERDICT:** ${up >= 3 ? '🟢 STRONG BUY' : down >= 3 ? '🔴 STRONG SELL' : '⚪ NEUTRAL'}`, { parse_mode: 'Markdown' });
    } catch (e) { bot.sendMessage(chatId, `⚠️ Predict Error.`); }
}

async function runBacktest(chatId, symbol, tf) {
    try {
        const data = await analyzeTimeframe(symbol, tf, 500); let wins = 0; let total = 0; const closes = data.ohlcv.map(c => Number(c[4]));
        const sEMA = EMA.calculate({ period: 9, values: closes }); const lEMA = EMA.calculate({ period: 21, values: closes });
        for (let i = 50; i < closes.length - 5; i++) {
            if ((sEMA[i] > lEMA[i] && sEMA[i-1] <= lEMA[i-1]) || (sEMA[i] < lEMA[i] && sEMA[i-1] >= lEMA[i-1])) {
                total++; if (closes[i+5] > closes[i]) wins++;
            }
        }
        bot.sendMessage(chatId, `⏱️ **BACKTEST: ${symbol} (${tf})**\nTrades: ${total} | Wins: ${wins}\n🏆 **Win Rate:** ${total > 0 ? ((wins/total)*100).toFixed(1) : 0}%`, { parse_mode: 'Markdown' });
    } catch (e) {}
}
async function runTopTraders(chatId, coinInput) {
    try {
        const res = await axios.get(`https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=${coinInput}USDT&period=15m`);
        const latest = res.data[res.data.length - 1];
        const longPct = (latest.longAccount * 100).toFixed(1); const shortPct = (latest.shortAccount * 100).toFixed(1);
        const verdict = latest.longAccount > latest.shortAccount ? '🟢 Whales LONGING' : '🔴 Whales SHORTING';
        bot.sendMessage(chatId, `👑 **TOP WHALES: ${coinInput}**\n🟢 **Longs:** ${longPct}%\n🔴 **Shorts:** ${shortPct}%\n🧠 **Verdict:** ${verdict}`, { parse_mode: 'Markdown' });
    } catch (e) { bot.sendMessage(chatId, `⚠️ Top Traders Error.`); }
}

async function runSweep(chatId) {
    const waitMsg = await bot.sendMessage(chatId, `🧹 Sweeping Liquidity...`);
    try {
        const tickers = await exchange.fetchTickers();
        const top = Object.values(tickers).filter(t => t.symbol.includes('USDT') && t.active && !t.symbol.includes('_') && t.quoteVolume > 15000000).sort((a,b)=>b.quoteVolume - a.quoteVolume).slice(0, 20);
        let found = "";
        for(const c of top) {
            const ohlcv = await exchange.fetchOHLCV(c.symbol, '15m', undefined, 20); if(!ohlcv) continue;
            const highs = ohlcv.slice(0, 18).map(x => x[2]); const lows = ohlcv.slice(0, 18).map(x => x[3]);
            const maxH = Math.max(...highs); const minL = Math.min(...lows);
            const lc = ohlcv[18]; 
            if (lc[2] > maxH && lc[4] < maxH && lc[1] < maxH) found += `🔴 **${c.symbol.split(':')[0]}**: Swept Highs (Bearish)!\n`;
            if (lc[3] < minL && lc[4] > minL && lc[1] > minL) found += `🟢 **${c.symbol.split(':')[0]}**: Swept Lows (Bullish)!\n`;
        }
        bot.editMessageText(found ? `🧹 **LIQUIDITY SWEEPS**\n\n${found}` : "💤 No fresh sweeps.", {chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown'});
    } catch(e) { bot.editMessageText("⚠️ Sweep Error.", {chat_id: chatId, message_id: waitMsg.message_id}); }
}

async function runFVG(chatId, symbol) {
    const waitMsg = await bot.sendMessage(chatId, `🧲 Scanning ${symbol} for FVGs...`);
    try {
        const ohlcv = await exchange.fetchOHLCV(symbol, '15m', undefined, 50); let gaps = "";
        for (let i = 2; i < ohlcv.length; i++) {
            const c1_h = ohlcv[i-2][2]; const c1_l = ohlcv[i-2][3]; const c3_h = ohlcv[i][2]; const c3_l = ohlcv[i][3];
            if (c1_h < c3_l) gaps = `🟢 **Bullish FVG!** Zone: $${c1_h} - $${c3_l}`;
            if (c1_l > c3_h) gaps = `🔴 **Bearish FVG!** Zone: $${c3_h} - $${c1_l}`;
        }
        bot.editMessageText(`🧲 **FVG SNIPER: ${symbol}**\n\n${gaps || "No imbalances found."}`, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
    } catch (e) { bot.editMessageText("⚠️ FVG Error.", { chat_id: chatId, message_id: waitMsg.message_id }); }
}

async function runOI(chatId, symbol) {
    try {
        const coin = symbol.replace('/','').replace('USDT','');
        const res = await axios.get(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${coin}USDT`);
        const hist = await axios.get(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${coin}USDT&period=5m&limit=12`);
        const cOI = parseFloat(res.data.openInterest); const oOI = parseFloat(hist.data[0].sumOpenInterest);
        const change = ((cOI - oOI) / oOI * 100).toFixed(2);
        bot.sendMessage(chatId, `🌊 **OI SURGE: ${symbol}**\n💰 **Current:** $${(cOI/1000000).toFixed(1)}M\n📈 **1h Change:** ${change}%`, { parse_mode: 'Markdown' });
    } catch (e) { bot.sendMessage(chatId, "⚠️ OI API Error."); }
}

async function runDecouple(chatId) {
    const waitMsg = await bot.sendMessage(chatId, `🔗 Scanning for decoupled alts...`);
    try {
        const tickers = await exchange.fetchTickers();
        const btc = Object.values(tickers).find(t => t.symbol.includes('BTC/USDT'))?.percentage || 0;
        let mutants = Object.values(tickers).filter(t => t.symbol.includes('/USDT') && t.active && !t.symbol.includes('_') && t.quoteVolume > 20000000);
        let list = btc < 0 ? mutants.filter(t => t.percentage > 0.5) : mutants.filter(t => t.percentage > btc + 3);
        list = list.sort((a,b) => b.percentage - a.percentage).slice(0, 5);
        let report = `🔗 **ALT DECOUPLER** (BTC: ${btc.toFixed(2)}%)\n\n`;
        list.forEach(t => report += `🚀 **${t.symbol.split(':')[0]}**: ${t.percentage.toFixed(2)}%\n`);
        bot.editMessageText(report, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
    } catch (e) { bot.editMessageText("⚠️ Decoupler Error.", { chat_id: chatId, message_id: waitMsg.message_id }); }
}

async function runLS(chatId, coinInput) {
    try {
        const res = await axios.get(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${coinInput}USDT&period=15m`);
        const latest = res.data[res.data.length - 1];
        bot.sendMessage(chatId, `⚖️ **RETAIL L/S: ${coinInput}**\n🟢 **Longs:** ${(latest.longAccount * 100).toFixed(1)}%\n🔴 **Shorts:** ${(latest.shortAccount * 100).toFixed(1)}%`, { parse_mode: 'Markdown' });
    } catch (e) { bot.sendMessage(chatId, `⚠️ L/S Error.`); }
}

async function runWall(chatId, symbol) {
    try {
        const ob = await exchange.fetchOrderBook(symbol, 100);
        const maxBid = ob.bids.reduce((max, bid) => bid[1] > max[1] ? bid : max, [0, 0]);
        const maxAsk = ob.asks.reduce((max, ask) => ask[1] > max[1] ? ask : max, [0, 0]);
        bot.sendMessage(chatId, `🧱 **WALLS: ${symbol}**\n🟢 **Buy Wall:** $${maxBid[0]} (Size: $${(maxBid[0]*maxBid[1]).toFixed(0)})\n🔴 **Sell Wall:** $${maxAsk[0]} (Size: $${(maxAsk[0]*maxAsk[1]).toFixed(0)})`, { parse_mode: 'Markdown' });
    } catch(e) {}
}

async function runFunding(chatId) {
    try {
        const rates = await exchange.fetchFundingRates();
        let targets = Object.values(rates).filter(r => r.symbol.includes('/USDT') && r.fundingRate < -0.0005).sort((a, b) => a.fundingRate - b.fundingRate).slice(0, 5);
        let report = `💣 **SHORT SQUEEZE WATCH**\n\n`; targets.forEach(t => { report += `**${t.symbol.split(':')[0]}**: ${(t.fundingRate * 100).toFixed(4)}%\n`; });
        bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    } catch (error) {}
}
// --- ALL SCANNERS SECURED WITH ZOMBIE FILTER ---
async function runHunter(chatId) {
    try {
        const t = await exchange.fetchTickers();
        const v = Object.values(t).filter(x => x.symbol.includes('USDT') && x.active && !x.symbol.includes('_') && x.quoteVolume > 15000000).sort((a,b) => Math.abs(b.percentage) - Math.abs(a.percentage)).slice(0, 2);
        if (v.length < 2) return bot.sendMessage(chatId, "🐺 **HUNTER**\nNot enough active data right now.");
        bot.sendMessage(chatId, `🐺 **HUNTER (Fast Movers)**\n🔥 **${v[0].symbol.split(':')[0]}**: ${v[0].percentage.toFixed(2)}%\n🔥 **${v[1].symbol.split(':')[0]}**: ${v[1].percentage.toFixed(2)}%`, { parse_mode: 'Markdown' });
    } catch (e) {}
}

async function runWhale(chatId) {
    try {
        const tickers = await exchange.fetchTickers();
        let top = Object.values(tickers).filter(t => t.symbol.includes('USDT') && t.active && !t.symbol.includes('_') && t.quoteVolume > 10000000).sort((a,b)=>b.quoteVolume-a.quoteVolume).slice(0, 50);
        let found = "";
        for (const c of top) {
            const o = await exchange.fetchOHLCV(c.symbol, '5m', undefined, 10); if (!o || o.length < 9) continue;
            const v = o[o.length-1][5]; const avg = (o.slice(0,8).reduce((a,b)=>a+b[5],0))/8;
            if (v > avg * 4.0) found += `🚨 **${c.symbol.split(':')[0]}**: ${(v/avg).toFixed(1)}x Vol Spike!\n`;
        }
        bot.sendMessage(chatId, found ? `🐋 **WHALE RADAR**\n\n${found}` : "💤 Ocean calm.", { parse_mode: 'Markdown' });
    } catch (e) {}
}

async function runDiv(chatId) {
    try {
        const tickers = await exchange.fetchTickers();
        const top = Object.values(tickers).filter(t => t.symbol.includes('USDT') && t.active && !t.symbol.includes('_') && t.quoteVolume > 10000000).sort((a,b)=>b.quoteVolume - a.quoteVolume).slice(0, 20);
        let found = "";
        for(const c of top) {
            const o = await exchange.fetchOHLCV(c.symbol, '15m', undefined, 50); if(!o) continue;
            const cl = o.map(x=>x[4]); const rsi = RSI.calculate({period: 14, values: cl});
            if(cl[cl.length-1] < cl[cl.length-5] && rsi[rsi.length-1] > rsi[rsi.length-5] && rsi[rsi.length-1] < 45) found += `🟢 **${c.symbol.split(':')[0]}**: Bullish Div!\n`;
        }
        bot.sendMessage(chatId, found ? `📈 **DIVERGENCE**\n\n${found}` : "💤 No clear divergence.", { parse_mode: 'Markdown' });
    } catch(e) {}
}

async function runRekt(chatId) {
    try {
        const tickers = await exchange.fetchTickers();
        const rekt = Object.values(tickers).filter(t => t.symbol.includes('USDT') && t.active && !t.symbol.includes('_') && t.percentage < -6 && t.quoteVolume > 15000000).sort((a,b)=>a.percentage - b.percentage).slice(0, 5);
        let msg = `🔥 **REKT HEATMAP**\n`; rekt.forEach(t => msg += `**${t.symbol.split(':')[0]}**: ${t.percentage.toFixed(2)}%\n`);
        bot.sendMessage(chatId, msg, {parse_mode: 'Markdown'});
    } catch(e) {}
}

async function runFib(chatId, symbol) {
    try {
        const ticker = await exchange.fetchTicker(symbol); const diff = ticker.high - ticker.low;
        bot.sendMessage(chatId, `📏 **FIBONACCI: ${symbol}**\n🎯 **0.618 (Golden):** $${(ticker.high - (diff * 0.618)).toFixed(4)}\n🛡️ **0.382:** $${(ticker.high - (diff * 0.382)).toFixed(4)}`, { parse_mode: 'Markdown' });
    } catch (e) {}
}

async function runQuant(chatId, symbol) {
    try {
        const o = await exchange.fetchOHLCV(symbol, '15m', undefined, 100); const closes = o.map(c => Number(c[4]));
        const cp = closes[closes.length - 1]; const mean = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const stdDev = Math.sqrt(closes.slice(-20).reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20);
        const zScore = ((cp - mean) / stdDev).toFixed(2);
        const kelly = (((2.0 * 0.55) - 0.45) / 2.0) / 2 * 100;
        bot.sendMessage(chatId, `🧮 **QUANT ENGINE: ${symbol}**\n💵 **Price:** $${cp}\n📊 **Z-Score:** ${zScore} σ\n\n🛡️ **Kelly Risk:** ${kelly.toFixed(2)}%\n🧠 **Verdict:** ${cp < mean - (stdDev*2) ? '🟢 OVERSOLD (Buy)' : cp > mean + (stdDev*2) ? '🔴 OVERBOUGHT (Sell)' : '⚪ NEUTRAL'}`, { parse_mode: 'Markdown' });
    } catch (e) {}
}

async function runSqueeze(chatId) {
    try {
        const t = await exchange.fetchTickers(); 
        const top = Object.values(t).filter(x => x.symbol.includes('USDT') && x.active && !x.symbol.includes('_') && x.quoteVolume > 20000000).slice(0, 30);
        let f = "";
        for (const c of top) {
            const o = await exchange.fetchOHLCV(c.symbol, '1h', undefined, 20); if(!o) continue;
            const cl = o.map(x => x[4]); const m = cl.reduce((a,b)=>a+b,0)/20;
            const sd = Math.sqrt(cl.reduce((a,b)=>a+Math.pow(b-m,2),0)/20);
            if (((sd * 4) / m * 100) < 2.0) f += `🧨 **${c.symbol.split(':')[0]}**: Coiled tight!\n`;
        }
        bot.sendMessage(chatId, f ? `🗜️ **VOLATILITY SQUEEZES**\n${f}` : "💤 No squeezes.", { parse_mode: 'Markdown' });
    } catch(e) {}
}

// --- NaN FIX FOR CHANDELIER EXIT ---
async function runTrail(chatId, symbol) {
    try {
        const ohlcv = await exchange.fetchOHLCV(symbol, '15m', undefined, 100);
        if (!ohlcv || ohlcv.length < 22) return bot.sendMessage(chatId, `⚠️ Not enough historical data for ${symbol}.`);
        const currentATR = ATR.calculate({ high: ohlcv.map(c=>c[2]), low: ohlcv.map(c=>c[3]), close: ohlcv.map(c=>c[4]), period: 22 }).pop();
        const last22 = ohlcv.slice(-22); const hH = Math.max(...last22.map(c=>c[2])); const lL = Math.min(...last22.map(c=>c[3]));
        if (!currentATR) return bot.sendMessage(chatId, `⚠️ Math Error: Could not calculate ATR.`);
        bot.sendMessage(chatId, `🛡️ **CHANDELIER EXIT: ${symbol}**\n🟢 **Long Trail SL:** $${(hH - (currentATR * 3)).toFixed(4)}\n🔴 **Short Trail SL:** $${(lL + (currentATR * 3)).toFixed(4)}`, { parse_mode: 'Markdown' });
    } catch(e) { bot.sendMessage(chatId, `⚠️ Trail Error: ${e.message}`); }
}

async function runDash(chatId, symbol) {
    try {
        const t = await exchange.fetchTicker(symbol); const d15 = await analyzeTimeframe(symbol, '15m');
        bot.sendMessage(chatId, `👑 **OMNI-DASH: ${symbol}**\n💵 **Price:** $${t.last}\n⏱️ **15m Trend:** ${d15.trend} (ADX: ${d15.adx.toFixed(1)})\n🌊 **VWAP:** $${d15.vwap.toFixed(4)}\n\n🤖 *Type /claw ${symbol.replace('/USDT','')} for AI*`, { parse_mode: 'Markdown' });
    } catch(e) {}
}

// --- STEALTH DEXSCREENER ---
async function runTokenScan(chatId, address) {
    try {
        const res = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${address}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
        if (!res.data.pairs || res.data.pairs.length === 0) return bot.sendMessage(chatId, "⚠️ Token Not Found.");
        const p = res.data.pairs[0]; const pressure = (p.txns?.h24?.buys > p.txns?.h24?.sells) ? '🟢 BUY FRENZY' : '🔴 SELL OFF';
        bot.sendMessage(chatId, `🔎 **X-RAY: ${p.baseToken.name}**\n⛓️ **Chain:** ${p.chainId.toUpperCase()}\n💵 **Price:** $${p.priceUsd}\n💧 **Liq:** $${p.liquidity?.usd}\n⚖️ **Flow:** ${pressure}\n🛡️ [View Holders](${p.url})`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (e) { bot.sendMessage(chatId, `⚠️ DexScreener Blocked: ${e.message}`); }
}
// --- STEALTH CRYPTOPANIC & COINGECKO (TRIM FIX ADDED) ---
async function runSocialHype(chatId) {
    try {
        const safeKey = process.env.CRYPTOPANIC_API_KEY.trim();
        const res = await axios.get(`https://cryptopanic.com/api/v1/posts/?auth_token=${safeKey}&filter=hot`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, timeout: 8000 });
        let counts = {};
        res.data.results.forEach(p => { if (p.currencies) p.currencies.forEach(c => counts[c.code.toUpperCase()] = (counts[c.code.toUpperCase()] || 0) + 1); });
        const alts = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).filter(s => s !== 'BTC' && s !== 'ETH').slice(0, 5);
        let report = `🗣️ **SOCIAL HYPE RADAR**\n\n`;
        alts.forEach((sym, i) => report += `**${i + 1}. ${sym}** (${counts[sym]} mentions)\n`);
        bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    } catch (e) { bot.sendMessage(chatId, `⚠️ CryptoPanic Error: ${e.message}`); }
}

async function runMorning(chatId) {
    const waitMsg = await bot.sendMessage(chatId, `☕ Brewing morning data...`);
    try {
        const safeKey = process.env.CRYPTOPANIC_API_KEY.trim();
        const response = await axios.get(`https://cryptopanic.com/api/v1/posts/?auth_token=${safeKey}&kind=news`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, timeout: 8000 });
        const headlines = response.data.results.slice(0, 10).map(post => post.title).join(". ");
        const result = await model.generateContent(`Read these 10 crypto headlines: "${headlines}". Write a 1-paragraph morning briefing.`);
        bot.editMessageText(`☕ **MORNING BRIEFING**\n\n${result.response.text()}`, { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' });
    } catch (e) { bot.editMessageText(`⚠️ Morning Error: ${e.message}`, { chat_id: chatId, message_id: waitMsg.message_id }); }
}

async function runFnG(chatId) {
    try {
        const res = await axios.get('https://api.alternative.me/fng/'); const d = res.data.data[0];
        bot.sendMessage(chatId, `🧭 **MACRO: FEAR & GREED**\n**Status:** ${d.value_classification} (${d.value}/100)`, { parse_mode: 'Markdown' });
    } catch (e) {}
}

async function runTrending(chatId) {
    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/search/trending', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, timeout: 5000 });
        let report = `🚀 **TOP TRENDING (CoinGecko)**\n\n`;
        res.data.coins.slice(0, 7).forEach((c, i) => report += `**${i + 1}. ${c.item.symbol.toUpperCase()}** (${c.item.name})\n`);
        bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    } catch (e) { bot.sendMessage(chatId, `⚠️ CoinGecko Error: ${e.message}`); }
}

// --- THE GHOST FUND TRADING LOGIC ---
async function runPaperTrade(chatId, direction, symbol, amountStr, levStr = "1") {
    const amount = parseFloat(amountStr); const leverage = parseFloat(levStr);
    if (isNaN(amount) || amount <= 0) return bot.sendMessage(chatId, "⚠️ Syntax: `/paper BUY SOL 500 10`", { parse_mode: 'Markdown' });
    try {
        const fund = getFund(); if (fund.balance < amount) return bot.sendMessage(chatId, `⚠️ Insufficient Margin.`);
        const ticker = await exchange.fetchTicker(symbol);
        fund.balance -= amount;
        fund.openTrades[symbol] = { direction: direction.toUpperCase(), entryPrice: ticker.last, size: (amount * leverage) / ticker.last, invested: amount, leverage: leverage };
        saveFund(fund);
        bot.sendMessage(chatId, `👻 **FUTURES TRADE OPENED**\n📈 **${direction.toUpperCase()}** ${symbol}\n⚡ **Lev:** ${leverage}x | 💵 **Entry:** $${ticker.last}`, { parse_mode: 'Markdown' });
    } catch(e) {}
}

async function runPortfolio(chatId) {
    try {
        const fund = getFund(); let report = `🏦 **GHOST FUND**\n💵 **Cash:** $${fund.balance.toFixed(2)}\n\n`;
        let tPnL = 0; let aV = 0;
        for (const s of Object.keys(fund.openTrades)) {
            const tr = fund.openTrades[s]; const t = await exchange.fetchTicker(s);
            let pnl = tr.direction === 'BUY' ? (t.last - tr.entryPrice) * tr.size : (tr.entryPrice - t.last) * tr.size;
            tPnL += pnl; aV += (tr.invested + pnl);
            report += `${pnl>=0?'🟢':'🔴'} **${s}** (${tr.leverage}x)\n• Entry: $${tr.entryPrice} | Live: $${t.last}\n• **PnL:** $${pnl.toFixed(2)}\n\n`;
        }
        report += `════════════\n📈 **Net Worth:** $${(fund.balance + aV).toFixed(2)}`;
        bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
    } catch(e) {}
}

async function runCloseTrade(chatId, symbol) {
    try {
        const fund = getFund(); if (!fund.openTrades[symbol]) return bot.sendMessage(chatId, `⚠️ No active trade.`);
        const tr = fund.openTrades[symbol]; const t = await exchange.fetchTicker(symbol);
        let pnl = tr.direction === 'BUY' ? (t.last - tr.entryPrice) * tr.size : (tr.entryPrice - t.last) * tr.size;
        fund.balance += (tr.invested + pnl); delete fund.openTrades[symbol]; saveFund(fund);
        bot.sendMessage(chatId, `🔒 **TRADE CLOSED: ${symbol}**\n🚪 **Exit:** $${t.last}\n💸 **PnL:** $${pnl.toFixed(2)}`, { parse_mode: 'Markdown' });
    } catch(e) {}
}
// ==========================================
//          BACKGROUND ALERTS
// ==========================================
let activeAlertChats = new Set(); let alertInt = null; let crashInt = null; let pulseInt = null;

bot.onText(/\/startalerts?(.*)/, (msg, match) => {
    const chatId = msg.chat.id; activeAlertChats.add(chatId);
    if (alertInt) return bot.sendMessage(chatId, "🔔 Alerts already running.");
    bot.sendMessage(chatId, `🔔 **OMNI-SCANNER ONLINE**\nTracking background anomalies...`);
    
    alertInt = setInterval(async () => {
        for (const c of ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']) {
            const d = await analyzeTimeframe(c, '15m');
            if (d && d.adx > 30) activeAlertChats.forEach(id => bot.sendMessage(id, `🚨 **TREND: ${c.split('/')[0]}**\nDirection: ${d.trend} | ADX: ${d.adx.toFixed(1)}`));
        }
    }, 900000); 

    crashInt = setInterval(async () => {
        try {
            const o = await exchange.fetchOHLCV('BTC/USDT', '1m', undefined, 2);
            const ch = (o[1][4] - o[1][1]) / o[1][1];
            if (ch < -0.015) activeAlertChats.forEach(id => bot.sendMessage(id, `🚨 **CRASH DETECTED** 🚨 BTC violently dumped!`));
            if (ch > 0.015) activeAlertChats.forEach(id => bot.sendMessage(id, `🚀 **PUMP DETECTED** 🚀 BTC violently pumped!`));
        } catch (e) {}
    }, 60000);

    pulseInt = setInterval(async () => {
        try {
            const tickers = await exchange.fetchTickers();
            const top = Object.values(tickers).filter(t => t.symbol.includes('USDT') && t.active && !t.symbol.includes('_') && t.quoteVolume > 50000000).slice(0, 10);
            for (const coin of top) {
                const o = await exchange.fetchOHLCV(coin.symbol, '5m', undefined, 2);
                if(!o || o.length < 2) continue;
                const change = (o[1][4] - o[1][1]) / o[1][1];
                if (change > 0.03) activeAlertChats.forEach(id => bot.sendMessage(id, `🐋 **WHALE RADAR:** ${coin.symbol.split(':')[0]} pumped +${(change*100).toFixed(1)}% in 5m!`));
                else if (change < -0.03) activeAlertChats.forEach(id => bot.sendMessage(id, `🩸 **WHALE RADAR:** ${coin.symbol.split(':')[0]} dumped ${(change*100).toFixed(1)}% in 5m!`));
            }
        } catch (e) {}
    }, 300000);
});

bot.onText(/\/stopalerts/, (msg) => { 
    clearInterval(alertInt); clearInterval(crashInt); clearInterval(pulseInt); 
    alertInt = null; crashInt = null; pulseInt = null; activeAlertChats.clear();
    bot.sendMessage(msg.chat.id, "🔕 Alerts disabled."); 
});

// ==========================================
//          TEXT ROUTERS & COMMANDS
// ==========================================
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id; const cmd = query.data; bot.answerCallbackQuery(query.id); 
    if (cmd === '/sweep') runSweep(chatId);
    else if (cmd === '/div') runDiv(chatId);
    else if (cmd === '/rekt') runRekt(chatId);
    else if (cmd === '/fng') runFnG(chatId);
    else if (cmd === '/hot') runTrending(chatId);
    else if (cmd === '/hype') runSocialHype(chatId);
    else if (cmd === '/squeeze') runSqueeze(chatId);
    else if (cmd === '/portfolio') runPortfolio(chatId);
    else if (cmd === '/decouple') runDecouple(chatId);
    else if (cmd === '/dash_help') bot.sendMessage(chatId, "👑 **Type:** `/dash BTC`", { parse_mode: 'Markdown' });
    else if (cmd === '/help_claw') bot.sendMessage(chatId, "🤖 **Type:** `/claw SOL`", { parse_mode: 'Markdown' });
    else if (cmd === '/quant_help') bot.sendMessage(chatId, "🧲 **Type:** `/quant SOL`", { parse_mode: 'Markdown' });
    else if (cmd === '/help_scan') bot.sendMessage(chatId, "🔎 **Type:** `/scan [ContractAddress]`", { parse_mode: 'Markdown' });
    else if (cmd === '/help_oi') bot.sendMessage(chatId, "🌊 **Type:** `/oi DOGE`", { parse_mode: 'Markdown' });
    else if (cmd === '/trail_help') bot.sendMessage(chatId, "🛡️ **Type:** `/trail SOL`", { parse_mode: 'Markdown' });
    else if (cmd === '/help_top') bot.sendMessage(chatId, "👑 **Type:** `/toptraders SOL`", { parse_mode: 'Markdown' });
    else if (cmd === '/help_wall') bot.sendMessage(chatId, "🧱 **Type:** `/wall SOL`", { parse_mode: 'Markdown' });
    else if (cmd.startsWith('/autodemo_')) {
        const parts = cmd.split('_'); 
        runPaperTrade(chatId, parts[1], `${parts[2]}/USDT`, "500", "10");
    }
});

bot.onText(/\/help/, (msg) => runHelp(msg.chat.id));
bot.onText(/\/setup (.+) (.+)/, (msg, match) => runSetup(msg.chat.id, `${match[1].toUpperCase()}/USDT`, match[2].toLowerCase()));
bot.onText(/\/dca (.+) (.+)/, (msg, match) => {
    const entry = parseFloat(match[1]); const sl = parseFloat(match[2]); const diff = Math.abs(entry - sl);
    bot.sendMessage(msg.chat.id, `🛡️ **DCA ZONES**\n1️⃣ $${entry}\n2️⃣ $${(entry > sl ? entry - (diff * 0.33) : entry + (diff * 0.33)).toFixed(4)}\n3️⃣ $${(entry > sl ? entry - (diff * 0.66) : entry + (diff * 0.66)).toFixed(4)}\n🛑 **SL:** $${sl}`, { parse_mode: 'Markdown' });
});
bot.onText(/\/risk (.+) (.+) (.+) (.+)/, (msg, match) => {
    const capital = parseFloat(match[1]); const riskPct = parseFloat(match[2]); const entry = parseFloat(match[3]); const sl = parseFloat(match[4]);
    const riskAmount = capital * (riskPct / 100); const leverage = ((riskAmount / Math.abs(entry - sl)) * entry) / capital;
    bot.sendMessage(msg.chat.id, `⚖️ **RISK MANAGER**\n• **Max Loss:** $${riskAmount.toFixed(2)}\n• **Req. Leverage:** ${Math.ceil(leverage)}x`);
});

bot.onText(/\/claw (.+)/, (msg, match) => runClaw(msg.chat.id, `${match[1].toUpperCase()}/USDT`));
bot.onText(/\/toptraders (.+)/, (msg, match) => runTopTraders(msg.chat.id, match[1].toUpperCase()));
bot.onText(/\/fvg (.+)/, (msg, match) => runFVG(msg.chat.id, `${match[1].toUpperCase()}/USDT`));
bot.onText(/\/oi (.+)/, (msg, match) => runOI(msg.chat.id, match[1].toUpperCase()));
bot.onText(/\/backtest (.+) (.+)/, (msg, match) => runBacktest(msg.chat.id, `${match[1].toUpperCase()}/USDT`, match[2].toLowerCase()));
bot.onText(/\/wall (.+)/, (msg, match) => runWall(msg.chat.id, `${match[1].toUpperCase()}/USDT`));
bot.onText(/\/predict (.+)/, (msg, match) => runPredict(msg.chat.id, `${match[1].toUpperCase()}/USDT`));
bot.onText(/\/ls (.+)/, (msg, match) => runLS(msg.chat.id, match[1].toUpperCase()));
bot.onText(/\/fib (.+)/, (msg, match) => runFib(msg.chat.id, `${match[1].toUpperCase()}/USDT`));
bot.onText(/\/scan (.+)/, (msg, match) => runTokenScan(msg.chat.id, match[1].trim()));
bot.onText(/\/quant (.+)/, (msg, match) => runQuant(msg.chat.id, `${match[1].toUpperCase()}/USDT`));
bot.onText(/\/trail (.+)/, (msg, match) => runTrail(msg.chat.id, `${match[1].toUpperCase()}/USDT`));
bot.onText(/\/dash (.+)/, (msg, match) => runDash(msg.chat.id, `${match[1].toUpperCase()}/USDT`));

bot.onText(/\/paper (BUY|SELL) ([A-Za-z0-9]+) ([0-9.]+) ?([0-9.]+)?/i, (msg, match) => {
    runPaperTrade(msg.chat.id, match[1], `${match[2].toUpperCase()}/USDT`, match[3], match[4] || "1");
});
bot.onText(/\/portfolio/, (msg) => runPortfolio(msg.chat.id));
bot.onText(/\/close (.+)/, (msg, match) => runCloseTrade(msg.chat.id, `${match[1].toUpperCase()}/USDT`));

bot.onText(/\/sweep/, (msg) => runSweep(msg.chat.id));
bot.onText(/\/div/, (msg) => runDiv(msg.chat.id));
bot.onText(/\/rekt/, (msg) => runRekt(msg.chat.id));
bot.onText(/\/fng/, (msg) => runFnG(msg.chat.id));
bot.onText(/\/hot/, (msg) => runTrending(msg.chat.id));
bot.onText(/\/hype/, (msg) => runSocialHype(msg.chat.id));
bot.onText(/\/squeeze/, (msg) => runSqueeze(msg.chat.id));
bot.onText(/\/hunt/, (msg) => runHunter(msg.chat.id));
bot.onText(/\/whale/, (msg) => runWhale(msg.chat.id));
bot.onText(/\/funding/, (msg) => runFunding(msg.chat.id));
bot.onText(/\/morning/, (msg) => runMorning(msg.chat.id));
bot.onText(/\/decouple/, (msg) => runDecouple(msg.chat.id));

bot.onText(/\/testkeys/, (msg) => {
    bot.sendMessage(msg.chat.id, `🔑 **SYSTEM CHECK**\nGemini: ${process.env.GEMINI_API_KEY ? "✅ OK" : "❌ MISSING"}\nCryptoPanic: ${process.env.CRYPTOPANIC_API_KEY ? "✅ OK" : "❌ MISSING"}`);
});

console.log("🚀 TITAN V8.0 THE IMMORTAL TERMINAL ONLINE - All Bugs Eradicated!");


