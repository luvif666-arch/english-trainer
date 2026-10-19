@echo off
chcp 65001 >nul
title 素材下载器
cd /d "%~dp0"

echo.
echo   ============================================
echo    素材下载器
echo   ============================================
echo.

REM 依赖自检：缺什么直接告诉用户怎么办
if not exist "yt-dlp.exe" (
    echo   [缺少] yt-dlp.exe
    echo.
    echo   请在项目目录打开命令行，执行：
    echo       pip install -U yt-dlp
    echo   然后把 yt-dlp.exe 复制到这个文件夹。
    echo.
    pause
    exit /b 1
)
if not exist "ffmpeg.exe" (
    echo   [缺少] ffmpeg.exe
    echo.
    echo   请安装 ffmpeg 后把 ffmpeg.exe 复制到这个文件夹。
    echo   或执行：pip install imageio-ffmpeg
    echo.
    pause
    exit /b 1
)

REM 找可用的 Python
set "PY="
where pythonw >nul 2>nul && set "PY=pythonw"
if not defined PY (
    where python >nul 2>nul && set "PY=python"
)
if not defined PY (
    echo   [缺少] 没找到 Python
    echo.
    echo   请安装 Python 3.8+，安装时勾选 "Add to PATH"。
    echo.
    pause
    exit /b 1
)

echo   正在启动，浏览器会自动打开...
echo.
%PY% "%~dp0download-tool.py"

if %errorlevel% neq 0 (
    echo.
    echo   启动失败。可能是端口 8765 被占用，关掉别的下载器窗口再试。
    pause
)