// services/webfetch.js
const { JSDOM } = require('jsdom');

class WebFetchService {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        this.timeout = 15000; // 15 seconds
        this.maxContentLength = 2000000; // 2MB
    }

    /**
     * Validate URL for security and determine content type
     * @param {string} url - URL to validate
     * @returns {object} - Validation result with type
     */
    analyzeUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Only allow HTTP and HTTPS
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return { valid: false, reason: 'Only HTTP and HTTPS URLs are supported' };
            }
            
            // Prevent local/private network access
            const hostname = urlObj.hostname.toLowerCase();
            if (
                hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname.startsWith('192.168.') ||
                hostname.startsWith('10.') ||
                hostname.startsWith('172.16.') ||
                hostname.startsWith('172.17.') ||
                hostname.startsWith('172.18.') ||
                hostname.startsWith('172.19.') ||
                hostname.startsWith('172.2') ||
                hostname.startsWith('172.30.') ||
                hostname.startsWith('172.31.') ||
                hostname.includes('internal') ||
                hostname.includes('local')
            ) {
                return { valid: false, reason: 'Private network URLs are not allowed for security' };
            }
            
            // Determine content type
            let contentType = 'webpage';
            if (urlObj.pathname.toLowerCase().endsWith('.pdf')) {
                contentType = 'pdf';
            } else if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                contentType = 'youtube';
            } else if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
                contentType = 'twitter';
            }
            
            return { valid: true, contentType, urlObj };
        } catch {
            return { valid: false, reason: 'Invalid URL format' };
        }
    }

    /**
     * Extract YouTube video information and transcript
     * @param {string} url - YouTube URL
     * @returns {Promise<object>} - Video info and transcript
     */
    async fetchYouTubeContent(url) {
        try {
            // Extract video ID
            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
            if (!videoIdMatch) {
                return { success: false, error: 'Could not extract YouTube video ID' };
            }
            
            const videoId = videoIdMatch[1];
            
            // Fetch video page to get basic info
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                headers: { 'User-Agent': this.userAgent }
            });
            
            if (!response.ok) {
                return { success: false, error: 'Could not access YouTube video' };
            }
            
            const html = await response.text();
            
            // Extract title and description
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
            const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'YouTube Video';
            
            // Try to extract description
            const descMatch = html.match(/"shortDescription":"([^"]+)"/);
            const description = descMatch ? descMatch[1].replace(/\\n/g, '\n') : '';
            
            return {
                success: true,
                title,
                content: `📺 **YouTube Video: ${title}**\n\n${description}\n\n🔗 **URL:** ${url}\n\n⚠️ **Note:** Full transcript extraction requires additional API access. This is the video description.`,
                type: 'youtube'
            };
            
        } catch (error) {
            console.error('YouTube fetch error:', error);
            return {
                success: false,
                error: 'Failed to fetch YouTube content. The video might be private or restricted.'
            };
        }
    }

    /**
     * Fetch PDF content (basic implementation)
     * @param {string} url - PDF URL
     * @returns {Promise<object>} - PDF content
     */
    async fetchPDFContent(url) {
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': this.userAgent },
                size: this.maxContentLength
            });
            
            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
            }
            
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/pdf')) {
                return { success: false, error: 'URL does not point to a PDF file' };
            }
            
            // For now, return basic info about the PDF
            const contentLength = response.headers.get('content-length');
            const fileName = url.split('/').pop() || 'document.pdf';
            
            return {
                success: true,
                title: `PDF Document: ${fileName}`,
                content: `📄 **PDF Document**\n\n**File:** ${fileName}\n**Size:** ${contentLength ? Math.round(contentLength / 1024) + ' KB' : 'Unknown'}\n**URL:** ${url}\n\n⚠️ **Note:** PDF text extraction requires additional processing. You can download this PDF directly from the URL above.`,
                type: 'pdf'
            };
            
        } catch (error) {
            console.error('PDF fetch error:', error);
            return {
                success: false,
                error: 'Failed to fetch PDF. The file might be too large or access restricted.'
            };
        }
    }

    /**
     * Extract news article content with better parsing
     * @param {string} html - HTML content
     * @param {string} url - Original URL for context
     * @returns {string} - Clean text content
     */
    extractNewsContent(html, url) {
        try {
            const dom = new JSDOM(html);
            const document = dom.window.document;
            
            // Remove unwanted elements
            const unwanted = document.querySelectorAll('script, style, nav, footer, header, aside, .advertisement, .ad, .sidebar, .comments, .social-share');
            unwanted.forEach(el => el.remove());
            
            // Try to find the main article content
            const articleSelectors = [
                'article[role="main"]',
                'main article',
                '.article-content',
                '.post-content',
                '.entry-content',
                '.content-body',
                '.story-body',
                '[role="main"]',
                'main',
                'article'
            ];
            
            let mainContent = null;
            for (const selector of articleSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.length > 200) {
                    mainContent = element;
                    break;
                }
            }
            
            if (!mainContent) {
                mainContent = document.body;
            }
            
            // Extract text and clean it up
            let text = mainContent.textContent || mainContent.innerText || '';
            
            // Clean up the text
            text = text
                .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
                .replace(/\n\s*\n/g, '\n') // Remove empty lines
                .replace(/\t/g, ' ') // Replace tabs with spaces
                .trim();
            
            // Limit length and add source info
            if (text.length > 4000) {
                text = text.substring(0, 4000) + '...\n\n[Content truncated for brevity]';
            }
            
            // Add source information
            const domain = new URL(url).hostname;
            text += `\n\n📰 **Source:** ${domain}`;
            
            return text;
            
        } catch (error) {
            console.error('Error extracting news content:', error);
            return 'Error extracting content from the webpage.';
        }
    }

    /**
     * Fetch and extract content from a URL with enhanced capabilities
     * @param {string} url - URL to fetch
     * @returns {Promise<{success: boolean, content?: string, title?: string, error?: string}>}
     */
    async fetchContent(url) {
        const analysis = this.analyzeUrl(url);
        
        if (!analysis.valid) {
            return {
                success: false,
                error: analysis.reason
            };
        }

        // Handle different content types
        switch (analysis.contentType) {
            case 'youtube':
                return await this.fetchYouTubeContent(url);
            case 'pdf':
                return await this.fetchPDFContent(url);
            default:
                return await this.fetchWebPageContent(url);
        }
    }

    /**
     * Fetch regular webpage content
     * @param {string} url - URL to fetch
     * @returns {Promise<object>} - Fetch result
     */
    async fetchWebPageContent(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                follow: 5, // Max redirects
                size: this.maxContentLength
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/html')) {
                return {
                    success: false,
                    error: 'Content is not HTML. Only web pages are supported for this URL.'
                };
            }

            const html = await response.text();
            const content = this.extractNewsContent(html, url);
            
            // Extract title
            let title = 'Untitled';
            try {
                const dom = new JSDOM(html);
                const titleElement = dom.window.document.querySelector('title');
                if (titleElement) {
                    title = titleElement.textContent.trim();
                }
            } catch {
                // Use URL as title if extraction fails
                title = new URL(url).hostname;
            }

            return {
                success: true,
                content,
                title,
                type: 'webpage'
            };

        } catch (error) {
            console.error('Fetch error:', error);
            
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Request timed out. The webpage took too long to respond.'
                };
            } else if (error.code === 'ENOTFOUND') {
                return {
                    success: false,
                    error: 'Website not found. Please check the URL and try again.'
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to fetch the webpage. Please check the URL and try again.'
                };
            }
        }
    }

    /**
     * Get a placeholder response for development
     * @param {string} url - The requested URL
     * @returns {object} - Placeholder response
     */
    getPlaceholderResponse(url) {
        return {
            success: true,
            title: 'Development Mode - Web Fetch',
            content: `This is a placeholder for web content from: ${url}\n\nIn production, this feature would fetch and extract the main content from the webpage, making it accessible even in regions where the site might be blocked.\n\nThe system would provide:\n- Clean, readable text content\n- Removal of ads and navigation\n- Title extraction\n- Security filtering\n\nNote: This is a development environment. Full web fetching capabilities would be available in production.`
        };
    }
}

module.exports = new WebFetchService();
