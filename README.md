# 🤖 TITAN V8.0: The Immortal Terminal
**An OpenClaw-Powered Quantitative Hedge Fund in Your Pocket.**
TITAN is an institutional-grade, fully autonomous quantitative trading terminal built on Telegram. Powered by OpenClaw and the Binance Futures API, it brings Wall Street-level math, smart-money tracking, and AI-driven market analysis directly to your phone.
## 🔥 Features and Capabilities
### 🧠 Intelligence & AI
 * **OpenClaw AI Bridge:** Institutional-grade market summaries breaking down VWAP, ADX, and order book walls.
 * **The Quant Engine:** Mathematical edge calculators providing Z-Scores and safe Kelly Criterion risk management.
 * **On-Chain X-Ray:** DexScreener integration to bypass firewalls and scan live liquidity flow on any token.
### 🎯 Execution & Strategy
 * **The Ghost Fund Simulator:** A fully integrated paper-trading engine with adjustable leverage and live portfolio tracking.
 * **1-Click Auto-Demo:** Automatically execute MTF-shielded trade setups into your Ghost Fund with a single tap.
 * **Chandelier Exit Tracker:** Real-time volatility-based trailing stop losses for precise exits.
### 🐋 Smart Money & Scanners
 * **Whale Pulse:** Real-time scanners for Liquidity Sweeps, Fair Value Gaps (FVGs), and Whale Open Interest spikes.
 * **Social Hype Radar:** Scrapes CryptoPanic for trending news and social sentiment.
 * **Anomaly Alerts:** 24/7 background monitoring for flash crashes, pumps, and massive volume spikes.
## 🛠 Installation & Setup (Termux / Node.js)
### 1. Clone & Install
```bash
git clone https://github.com/Rajharsh7418/titan-trading-terminal.git
cd titan-trading-terminal
npm install

```
### 2. Configure Environment
Create a .env file in the root directory:
```bash
nano .env

```
Add your credentials:
```text
TELEGRAM_TOKEN=your_bot_token
CHAT_ID=your_telegram_id
GEMINI_API_KEY=your_google_ai_key
CRYPTOPANIC_API_KEY=your_cryptopanic_key

```
### 3. Launch the Terminal
**Session 1 (OpenClaw):**
```bash
node -r ./hijack.js $(which openclaw) gateway run

```
**Session 2 (TITAN):**
```bash
node index.js

```
## 📖 Master Commands
 * /dash [SYMBOL] — God-Mode dashboard.
 * /claw [SYMBOL] — Deep AI Technical Analysis.
 * /setup [SYMBOL] [TF] — Multi-Timeframe Shielded Setup.
 * /scan [CA] — On-Chain DexScreener X-Ray.
 * /paper [BUY/SELL] [SYMBOL] [AMT] [LEV] — Execute Paper Trade.
 * /startalerts — Enable 24/7 background anomaly tracking.
## ⚠️ Disclaimer
TITAN is a community-built, open-source quantitative tool. It is for educational purposes and simulated trading. It is not a tradable token or official Binance-endorsed product. Trading involves risk; always use the Ghost Fund to backtest strategies.
**Developed by Rajharsh7418**
