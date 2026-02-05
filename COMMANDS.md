# Voice AI 常用指令

## Git 更新流程

### 本機 (Windows)

```bash
cd C:/sightour/voice-ai

# 查看修改狀態
git status

# 添加所有修改
git add .

# 提交
git commit -m "更新說明"

# 推送到 GitHub
git push
```

### 伺服器 (192.168.0.28)

```bash
cd /MODULE/tidy/voice-ai

# 拉取最新程式碼
git pull origin main
```

---

## 啟動服務

### 後端

```bash
cd /MODULE/tidy/voice-ai/backend

# 啟用虛擬環境
conda activate voice

# 啟動後端
uvicorn app.main:app --host 0.0.0.0 --port 8000
USE_GPU=true uvicorn app.main:app --host 0.0.0.0 --port 8000

# 背景執行 (可關閉終端)
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

### 前端

```bash
cd /MODULE/tidy/voice-ai/frontend

# 開發模式
npx vite --host --port 9010

# 背景執行
nohup npx vite --host --port 9010 > frontend.log 2>&1 &

npm run dev -- --host --port 9010

```

---

## 停止服務

```bash
# 查看運行中的程序
ps aux | grep uvicorn
ps aux | grep vite

# 停止程序 (用上面查到的 PID)
kill <PID>

# 或強制停止
pkill -f uvicorn
pkill -f vite
```

---

## 查看日誌

```bash
# 即時查看後端日誌
tail -f /MODULE/tidy/voice-ai/backend/backend.log

# 即時查看前端日誌
tail -f /MODULE/tidy/voice-ai/frontend/frontend.log
```

---

## 存取位址

| 服務 | URL |
|------|-----|
| 前端 | http://192.168.0.28:9010 |
| 後端 API | http://192.168.0.28:8000 |
| API 文件 | http://192.168.0.28:8000/docs |

---

## 常見問題

### 權限問題
```bash
npx vite --host --port 9010
```

### 更新依賴
```bash
# 後端
cd /MODULE/tidy/voice-ai/backend
pip install -r requirements.txt

# 前端
cd /MODULE/tidy/voice-ai/frontend
npm install
```
