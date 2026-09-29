@echo off
cd /d "%~dp0"
"C:\Users\wahyu.dwiatmoko\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 8091 --bind 127.0.0.1 > server.out.log 2> server.err.log
