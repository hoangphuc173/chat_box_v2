#include "auth/bcrypt_wrapper.h"
#include <bcrypt/BCrypt.hpp>

std::string BcryptWrapper::hash(const std::string& password, int rounds) {
    return BCrypt::generateHash(password, rounds);
}

bool BcryptWrapper::verify(const std::string& password, const std::string& hash) {
    return BCrypt::validatePassword(password, hash);
}
