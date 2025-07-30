// services/news.js
const webfetchService = require('./webfetch');
const openaiService = require('./openai');

class NewsService {
    constructor() {
        this.newsSources = [
            { name: 'BBC Ethiopia', url: 'https://www.bbc.com/news/topics/c302m85q5ljt/ethiopia' },
            { name: 'Reuters Africa', url: 'https://www.reuters.com/world/africa/' },
            { name: 'Al Jazeera Africa', url: 'https://www.aljazeera.com/africa/' },
            { name: 'CNN Africa', url: 'https://edition.cnn.com/africa' },
            { name: 'AllAfrica', url: 'https://allafrica.com/ethiopia/' }
        ];
    }

    /**
     * Aggregate news from multiple sources
     * @param {string} topic - News topic to search for
     * @param {number} maxSources - Maximum number of sources to check
     * @returns {Promise<string>} - Aggregated news summary
     */
    async aggregateNews(topic, maxSources = 3) {
        try {
            const searchPrompt = `Based on your knowledge, provide a comprehensive news summary about "${topic}" focusing on recent developments. Include:

1. **Current Status**: What's happening now
2. **Recent Developments**: Key events in the past weeks
3. **Context**: Background information for understanding
4. **Multiple Perspectives**: Different viewpoints when applicable
5. **Impact**: How this affects people and regions involved

If you don't have recent information, explain that and provide the most current context you can. Focus on factual reporting and include caveats about information currency.

Topic: ${topic}`;

            const summary = await openaiService.getChatCompletion(searchPrompt);
            
            return `📰 **News Summary: ${topic}**\n\n${summary}\n\n**Sources**: AI-generated summary based on training data\n**Note**: For the most current information, verify with recent news sources.`;

        } catch (error) {
            console.error('News aggregation error:', error);
            return `❌ Failed to generate news summary for "${topic}". Please try again or use /fetch with a specific news URL.`;
        }
    }

    /**
     * Get Ethiopian-specific news
     * @returns {Promise<string>} - Ethiopian news summary
     */
    async getEthiopianNews() {
        const topics = [
            'Ethiopian politics and government',
            'Ethiopian economy and development',
            'Ethiopian society and culture',
            'Horn of Africa regional affairs'
        ];

        const prompt = `Provide a comprehensive overview of current affairs in Ethiopia covering these areas:

1. **Political Developments**: Government, policies, elections
2. **Economic Situation**: Growth, challenges, opportunities  
3. **Social Issues**: Education, healthcare, infrastructure
4. **Regional Context**: Horn of Africa, neighboring countries
5. **International Relations**: Foreign policy, aid, trade

Please provide factual, balanced reporting and note any limitations in current information availability.`;

        try {
            const summary = await openaiService.getChatCompletion(prompt);
            return `🇪🇹 **Ethiopian News Overview**\n\n${summary}\n\n**Note**: This is an AI-generated overview. For breaking news, check recent sources.`;
        } catch (error) {
            console.error('Ethiopian news error:', error);
            return '❌ Failed to generate Ethiopian news overview. Please try again.';
        }
    }

    /**
     * Search for news about a specific region or country
     * @param {string} region - Region or country name
     * @returns {Promise<string>} - Regional news summary
     */
    async getRegionalNews(region) {
        const prompt = `Provide current news and information about ${region}, including:

1. **Political Situation**: Government, leadership, policies
2. **Economic Conditions**: Major economic trends and challenges
3. **Social Developments**: Important social issues and changes
4. **International Relations**: Relations with other countries
5. **Current Events**: Recent significant events or developments

Please provide balanced, factual information and note any limitations in current data.`;

        try {
            const summary = await openaiService.getChatCompletion(prompt);
            return `🌍 **Regional News: ${region}**\n\n${summary}\n\n**Note**: AI-generated summary - verify important information with current sources.`;
        } catch (error) {
            console.error('Regional news error:', error);
            return `❌ Failed to generate news summary for ${region}. Please try again.`;
        }
    }

    /**
     * Get technology and digital rights news
     * @returns {Promise<string>} - Tech news summary
     */
    async getTechNews() {
        const prompt = `Provide a summary of current technology and digital rights news, focusing on:

1. **Internet Freedom**: Censorship, access rights, digital sovereignty
2. **AI and Technology**: Latest AI developments, ethical considerations
3. **Privacy and Security**: Data protection, surveillance, cybersecurity
4. **Digital Divide**: Technology access, infrastructure development
5. **Social Media and Communication**: Platform policies, freedom of expression

Focus on developments that affect global digital access and rights.`;

        try {
            const summary = await openaiService.getChatCompletion(prompt);
            return `💻 **Technology & Digital Rights News**\n\n${summary}\n\n**Note**: AI-generated summary focusing on digital freedom and technology access.`;
        } catch (error) {
            console.error('Tech news error:', error);
            return '❌ Failed to generate technology news summary. Please try again.';
        }
    }
}

module.exports = new NewsService();
