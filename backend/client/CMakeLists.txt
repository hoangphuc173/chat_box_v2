cmake_minimum_required(VERSION 3.16)
project(ChatBoxClient VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find packages (if using system libraries)
# find_package(OpenSSL REQUIRED)
# find_package(Boost REQUIRED COMPONENTS system)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../server/include  # Shared protocol
)

# Source files
set(SOURCES
    src/main.cpp
    src/chat_client.cpp
    src/protocol_handler.cpp
)

# Header files
set(HEADERS
    include/chat_client.h
    include/protocol_handler.h
)

# Create executable
add_executable(chat_client ${SOURCES} ${HEADERS})

# Link libraries
# target_link_libraries(chat_client PRIVATE OpenSSL::SSL OpenSSL::Crypto)

# Compiler options
if(MSVC)
    target_compile_options(chat_client PRIVATE /W4)
else()
    target_compile_options(chat_client PRIVATE -Wall -Wextra -pedantic)
endif()

# Output directory
set_target_properties(chat_client PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

# Install
install(TARGETS chat_client DESTINATION bin)
