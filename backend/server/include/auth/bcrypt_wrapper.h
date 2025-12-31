#ifndef BCRYPT_WRAPPER_H
#define BCRYPT_WRAPPER_H

#include <string>

class BcryptWrapper {
public:
    static std::string hash(const std::string& password, int rounds = 12);
    static bool verify(const std::string& password, const std::string& hash);
};

#endif // BCRYPT_WRAPPER_H
