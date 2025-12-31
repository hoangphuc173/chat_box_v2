#ifndef GEMINI_CLIENT_H
#define GEMINI_CLIENT_H

#include <string>
#include <vector>
#include <optional>

/**
 * Gemini AI Client
 * 
 * Features:
 * - Send messages to Gemini API
 * - Maintain conversation history
 * - Stream responses (optional)
 */
class GeminiClient {
public:
    GeminiClient(const std::string& apiKey);
    ~GeminiClient();
    
    /**
     * Send message and get response
     * @param message User message
     * @param conversationHistory Previous messages (optional)
     * @return AI response
     */
    std::optional<std::string> sendMessage(const std::string& message,
                                           const std::vector<std::string>& conversationHistory = {});
    
    /**
     * Generate response with context
     * @param prompt System prompt/context
     * @param message User message
     * @return AI response
     */
    std::optional<std::string> generateResponse(const std::string& prompt,
                                                const std::string& message);
    
private:
    std::string apiKey_;
    std::string apiEndpoint_;
    
    // Helper: Make HTTP POST request
    std::optional<std::string> makeRequest(const std::string& jsonPayload);
    
    // Helper: Build JSON payload
    std::string buildPayload(const std::string& message,
                            const std::vector<std::string>& history);
};

#endif // GEMINI_CLIENT_H
