# Voice AI 常用指令

## 登入資訊

| 帳號 | 密碼 |
|------|------|
| sightour | 25916247 |

---

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
git push origin main
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
conda activate voice

# 前景執行
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 背景執行
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# 使用 GPU
USE_GPU=true uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd /MODULE/tidy/voice-ai/frontend

# 前景執行
npx vite --host --port 9010

# 背景執行
nohup npx vite --host --port 9010 > frontend.log 2>&1 &
```

---

## 停止服務

```bash
# 停止後端
pkill -f "uvicorn app.main:app"

# 停止前端
pkill -f vite

# 查看運行中的程序
ps aux | grep uvicorn
ps aux | grep vite
```

---

## 重置資料庫

當資料庫結構更新時需要重置：

```bash
cd /MODULE/tidy/voice-ai/backend

# 停止後端
pkill -f "uvicorn app.main:app"

# 刪除資料庫
rm -f voice_ai.db

# 重啟後端 (會自動建立新資料庫和預設帳號)
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

---

## 完整更新流程

```bash
cd /MODULE/tidy/voice-ai

# 1. 拉取最新程式碼
git pull origin main

# 2. 重啟後端
pkill -f "uvicorn app.main:app"
cd backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# 3. 重啟前端
cd ../frontend
pkill -f vite
nohup npx vite --host --port 9010 > frontend.log 2>&1 &
```

---

## 查看日誌

```bash
# 後端日誌
tail -f /MODULE/tidy/voice-ai/backend/backend.log

# 前端日誌
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

## 更新依賴

```bash
# 後端
cd /MODULE/tidy/voice-ai/backend
pip install -r requirements.txt

# 前端
cd /MODULE/tidy/voice-ai/frontend
npm install
```
