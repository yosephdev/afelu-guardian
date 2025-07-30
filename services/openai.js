// services/openai.js
require('dotenv').config();

class OpenAIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
        
        if (!this.apiKey) {
            console.warn('⚠️ OpenAI API key not found. AI features will use placeholder responses.');
        }
    }

    /**
     * Send a chat completion request to OpenAI with language detection and support
     * @param {string} prompt - User's prompt
     * @param {string} model - OpenAI model to use (default: gpt-4o-mini)
     * @param {string} preferredLanguage - User's preferred language
     * @returns {Promise<string>} - AI response
     */
    async getChatCompletion(prompt, model = 'gpt-4o-mini', preferredLanguage = 'auto') {
        if (!this.apiKey) {
            return this.getPlaceholderResponse(prompt);
        }

        try {
            // Detect if the prompt is in Amharic or other Ethiopian languages
            const isAmharic = /[\u1200-\u137F]/.test(prompt);
            const isArabic = /[\u0600-\u06FF]/.test(prompt);
            
            let systemPrompt = 'You are a helpful assistant. Provide accurate, helpful, and safe responses. Keep responses concise but informative. If asked about sensitive topics, provide balanced and factual information.';
            
            // Adjust system prompt based on detected language
            if (isAmharic || preferredLanguage === 'amharic') {
                systemPrompt += ' The user is writing in Amharic. Please respond in Amharic when appropriate, and if you cannot write in Amharic, provide your response in English but mention that you understand their Amharic question.';
            } else if (isArabic || preferredLanguage === 'arabic') {
                systemPrompt += ' The user is writing in Arabic. Please respond in Arabic when appropriate.';
            } else if (preferredLanguage && preferredLanguage !== 'auto' && preferredLanguage !== 'english') {
                systemPrompt += ` Please respond in ${preferredLanguage} when possible.`;
            }

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.7,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from OpenAI API');
            }

            return data.choices[0].message.content.trim();

        } catch (error) {
            console.error('❌ OpenAI API error:', error);
            
            // Return a helpful error message to the user
            if (error.message.includes('rate limit')) {
                return '⚠️ The AI service is currently experiencing high demand. Please try again in a few moments.';
            } else if (error.message.includes('quota')) {
                return '⚠️ The AI service quota has been exceeded. Please contact support.';
            } else {
                return '❌ Sorry, I encountered an error while processing your request. Please try again or contact support if the issue persists.';
            }
        }
    }

    /**
     * Generate an image with DALL-E
     * @param {string} prompt - Image description
     * @param {string} size - Image size (256x256, 512x512, 1024x1024)
     * @returns {Promise<string>} - Image URL or error message
     */
    async generateImage(prompt, size = '512x512') {
        if (!this.apiKey) {
            return '🎨 Image generation is not available in development mode. This feature requires OpenAI API access.';
        }

        try {
            const response = await fetch(`${this.baseURL}/images/generations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    n: 1,
                    size: size,
                    response_format: 'url'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`DALL-E API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (!data.data || !data.data[0] || !data.data[0].url) {
                throw new Error('Invalid response format from DALL-E API');
            }

            return data.data[0].url;

        } catch (error) {
            console.error('❌ DALL-E API error:', error);
            return '❌ Sorry, I couldn\'t generate the image. Please try again with a different description.';
        }
    }

    /**
     * Summarize text content
     * @param {string} text - Text to summarize
     * @param {string} language - Target language for summary
     * @returns {Promise<string>} - Summary
     */
    async summarizeText(text, language = 'english') {
        const prompt = `Please summarize the following text in ${language}. Keep it concise but capture the main points:\n\n${text.substring(0, 3000)}`;
        return await this.getChatCompletion(prompt, 'gpt-4o-mini', language);
    }

    /**
     * Placeholder response when OpenAI API is not available
     * @param {string} prompt - User's prompt
     * @returns {string} - Placeholder response
     */
    getPlaceholderResponse(prompt) {
        return `🤖 **AI Response (Development Mode):**\n\nThank you for your question: "${prompt}"\n\nThis is a placeholder response. In production, this would be replaced with an actual AI response from OpenAI. The system is designed to provide helpful, accurate, and safe responses to your questions.\n\n**Note:** This is a development/testing environment. Contact your administrator to enable full AI functionality.`;
    }

    /**
     * Check if OpenAI service is properly configured
     * @returns {boolean} - Whether OpenAI is configured
     */
    isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Test the OpenAI connection
     * @returns {Promise<boolean>} - Whether connection is successful
     */
    async testConnection() {
        if (!this.apiKey) {
            return false;
        }

        try {
            await this.getChatCompletion('Hello, this is a test.');
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = new OpenAIService();
