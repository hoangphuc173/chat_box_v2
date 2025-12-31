#ifndef CONFIG_LOADER_H
#define CONFIG_LOADER_H

#include <string>
#include <map>

struct Config {
    // MySQL Configuration
    std::string mysqlHost;
    int mysqlPort;
    std::string mysqlUser;
    std::string mysqlPassword;
    std::string mysqlDatabase;
    
    // AWS Configuration (optional - for future)
    std::string awsAccessKey;
    std::string awsSecretKey;
    std::string awsRegion;
    std::string s3Bucket;
    
    // Server Configuration
    std::string serverIP;
    int serverPort;
    std::string serverHost;
    
    // JWT Configuration
    std::string jwtSecret;
    int jwtExpiry;  // seconds
    
    // Gemini AI
    std::string geminiApiKey;
    
    // Debug
    bool debug;
    std::string logLevel;
};

class ConfigLoader {
public:
    static Config load(const std::string& envFile);
    
private:
    static std::map<std::string, std::string> parseEnvFile(const std::string& filename);
    static std::string getEnv(const std::map<std::string, std::string>& env, 
                              const std::string& key, 
                              const std::string& defaultValue = "");
    static int getEnvInt(const std::map<std::string, std::string>& env,
                        const std::string& key,
                        int defaultValue = 0);
    static bool getEnvBool(const std::map<std::string, std::string>& env,
                          const std::string& key,
                          bool defaultValue = false);
};

#endif // CONFIG_LOADER_H
