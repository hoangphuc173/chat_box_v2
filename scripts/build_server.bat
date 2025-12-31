@echo off
echo ========================================
echo Building ChatBox Server with Visual Studio 2022
echo ========================================

REM Setup Visual Studio environment
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x64

REM Navigate to build directory  
cd /d "%~dp0backend\server\build"

REM Run CMake configuration
echo.
echo Configuring with CMake...
cmake .. -G "Visual Studio 17 2022" -A x64 -DCMAKE_TOOLCHAIN_FILE="C:/vcpkg/scripts/buildsystems/vcpkg.cmake"

REM Build Release configuration
echo.
echo Building Release configuration...
cmake --build . --config Release

echo.
echo ========================================
echo Build complete! Executable should be at:
echo backend\server\build\Release\chat_server.exe
echo ========================================
pause
