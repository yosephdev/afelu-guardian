const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Enhanced AI service with Claude 3.5 Sonnet
class AIService {
    constructor() {
        this.anthropic = anthropic;
        this.fallbackToOpenAI = true; // Keep OpenAI as fallback
    }

    async generateResponse(prompt, options = {}) {
        const {
            maxTokens = 1000,
            temperature = 0.7,
            useOpenAIFallback = true
        } = options;

        try {
            // Primary: Use Claude 3.5 Sonnet
            const response = await this.anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: maxTokens,
                temperature: temperature,
                messages: [
                    {
                        role: "user",
                        content: this.enhancePromptForEthiopia(prompt)
                    }
                ]
            });

            return {
                text: response.content[0].text,
                provider: 'claude',
                tokens: response.usage.input_tokens + response.usage.output_tokens,
                cost: this.calculateCost(response.usage, 'claude')
            };

        } catch (error) {
            console.error('Claude API error:', error);
            
            if (useOpenAIFallback && this.fallbackToOpenAI) {
                // Fallback to OpenAI
                return await this.useOpenAIFallback(prompt, options);
            }
            
            throw error;
        }
    }

    // Enhance prompts with Ethiopian context
    enhancePromptForEthiopia(prompt) {
        const ethiopianContext = `
You are assisting someone in Ethiopia. Please consider:
- Ethiopian cultural context and values
- Amharic language support when needed
- Local customs and traditions
- Educational needs in developing regions
- Respectful and culturally appropriate responses

User request: ${prompt}`;
        
        return ethiopianContext;
    }

    // Calculate actual costs for tracking
    calculateCost(usage, provider) {
        const costs = {
            claude: {
                input: 3.00 / 1000000,  // $3 per 1M input tokens
                output: 15.00 / 1000000  // $15 per 1M output tokens
            },
            openai: {
                input: 0.15 / 1000000,   // GPT-4o-mini: $0.15 per 1M input tokens
                output: 0.60 / 1000000   // GPT-4o-mini: $0.60 per 1M output tokens
            }
        };

        const rate = costs[provider];
        return (usage.input_tokens * rate.input) + (usage.output_tokens * rate.output);
    }

    // OpenAI fallback method
    async useOpenAIFallback(prompt, options) {
        const { Configuration, OpenAIApi } = require('openai');
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        const response = await openai.createChatCompletion({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
        });

        return {
            text: response.data.choices[0].message.content,
            provider: 'openai-fallback',
            tokens: response.data.usage.total_tokens,
            cost: this.calculateCost(response.data.usage, 'openai')
        };
    }

    // Enhanced translation specifically for Ethiopian languages
    async translateText(text, targetLanguage) {
        const translationPrompt = `
Translate the following text to ${targetLanguage}. 
If translating to/from Amharic, ensure cultural accuracy and proper context.
If translating to/from other Ethiopian languages (Oromo, Tigrinya, etc.), provide the best possible translation.

Text to translate: "${text}"

Provide only the translation, no explanations.`;

        return await this.generateResponse(translationPrompt, { maxTokens: 500 });
    }

    // Specialized educational assistance
    async provideEducationalHelp(question, subject) {
        const educationalPrompt = `
You are helping an Ethiopian student with their studies. Please provide clear, educational assistance.
Subject: ${subject}
Student's question: ${question}

Provide a helpful, detailed explanation that:
- Is appropriate for the educational level
- Uses examples relevant to Ethiopian context when possible
- Encourages learning and understanding
- Is respectful of local educational standards`;

        return await this.generateResponse(educationalPrompt, { maxTokens: 1500 });
    }
}

module.exports = new AIService();
