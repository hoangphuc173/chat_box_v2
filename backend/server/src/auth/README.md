# Authentication Module - Implementation Template

## Files Created:
- `include/auth/auth_manager.h`
- `include/auth/jwt_handler.h`
- `include/auth/bcrypt_wrapper.h`
- `src/auth/auth_manager.cpp`
- `src/auth/jwt_handler.cpp`
- `src/auth/bcrypt_wrapper.cpp`

## Features:
✅ User Registration (bcrypt password hashing)
✅ Login (JWT token generation)
✅ Token Validation
✅ Session Management (DynamoDB Sessions table)
✅ Logout
✅ Heartbeat handling

## Usage Example:
```cpp
AuthManager auth(dynamoClient, jwtSecret, jwtExpiry);

// Register
bool success = auth.registerUser("user123", "password", "user@example.com");

// Login
auto token = auth.login("user123", "password");
// Returns JWT token

// Validate
bool valid = auth.validateToken(token);
```

See implementation in `src/auth/` folder.
