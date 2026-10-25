@echo off
chcp 65001 >nul
title 嵌入式学习平台 - 公网访问启动器
cd /d "%~dp0"

echo ============================================
echo   嵌入式学习平台 · 公网访问一键启动
echo ============================================
echo.

echo [1/3] 启动本地服务器 (端口 8080)...
start "embedded-site-server" cmd /c "node server.js 8080 & pause"
timeout /t 2 /nobreak >nul

echo [2/3] 启动 localtunnel 隧道 (固定子域名)...
start "tunnel-localtunnel" cmd /c "lt --port 8080 --subdomain embedded-learn & pause"

echo [3/3] 启动 localhost.run 隧道 (无提醒页)...
start "tunnel-lhr" cmd /c "ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run & pause"

timeout /t 5 /nobreak >nul
echo.
echo 已全部启动:
echo   本地访问 : http://localhost:8080
echo   公网入口1: https://embedded-learn.loca.lt
echo              (首次访问需输入本机公网IP, 在 tunnel-localtunnel 窗口查看)
echo   公网入口2: 见 tunnel-lhr 窗口中的 https://xxxx.lhr.life 地址
echo.
echo 关闭方法: 关闭对应的命令行窗口即可
echo.
pause
