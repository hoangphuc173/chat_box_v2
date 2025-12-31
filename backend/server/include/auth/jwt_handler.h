#ifndef JWT_HANDLER_H
#define JWT_HANDLER_H

#include <string>
#include <map>

class JWTHandler {
public:
    static std::string create(const std::map<std::string, std::string>& claims,
                             const std::string& secret);
    
    static bool verify(const std::string& token, const std::string& secret);
    
    static std::map<std::string, std::string> decode(const std::string& token,
                                                     const std::string& secret);
    
private:
    static std::string base64Encode(const std::string& input);
    static std::string base64Decode(const std::string& input);
    static std::string hmacSha256(const std::string& data, const std::string& key);
};

#endif // JWT_HANDLER_H
