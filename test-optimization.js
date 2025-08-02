// Quick test script to validate our cost optimization
const CostOptimizedAI = require('./services/cost-optimized-ai');

async function testOptimization() {
    console.log('🧪 Testing Cost Optimization System...\n');
    
    const optimizer = new CostOptimizedAI();
    
    // Test 1: First call (should go to API)
    console.log('Test 1: First call to "What is AI?"');
    const response1 = await optimizer.getResponse('What is AI?', 'test-user');
    console.log('Response:', response1.text ? response1.text.substring(0, 100) + '...' : 'No response');
    console.log('Source:', response1.cached ? '💰 CACHED' : '🤖 API CALL');
    console.log('Cost:', response1.cost);
    console.log('Provider:', response1.provider || 'unknown');
    console.log('');
    
    // Test 2: Same question (should be cached)
    console.log('Test 2: Same question "What is AI?" (should be cached)');
    const response2 = await optimizer.getResponse('What is AI?', 'test-user');
    console.log('Response:', response2.text ? response2.text.substring(0, 100) + '...' : 'No response');
    console.log('Source:', response2.cached ? '💰 CACHED' : '🤖 API CALL');
    console.log('Cost:', response2.cost);
    console.log('Provider:', response2.provider || 'unknown');
    console.log('');
    
    // Test 3: New question (should go to API)
    console.log('Test 3: New question "How does machine learning work?"');
    const response3 = await optimizer.getResponse('How does machine learning work?', 'test-user');
    console.log('Response:', response3.text ? response3.text.substring(0, 100) + '...' : 'No response');
    console.log('Source:', response3.cached ? '💰 CACHED' : '🤖 API CALL');
    console.log('Cost:', response3.cost);
    console.log('Provider:', response3.provider || 'unknown');
    console.log('');
    
    // Test 4: Cache the new question
    console.log('Test 4: Repeat question "How does machine learning work?" (should be cached)');
    const response4 = await optimizer.getResponse('How does machine learning work?', 'test-user');
    console.log('Response:', response4.text ? response4.text.substring(0, 100) + '...' : 'No response');
    console.log('Source:', response4.cached ? '💰 CACHED' : '🤖 API CALL');
    console.log('Cost:', response4.cost);
    console.log('Provider:', response4.provider || 'unknown');
    console.log('');
    
    // Show statistics
    const stats = optimizer.getStats();
    console.log('📊 Overall Statistics:');
    console.log('Total requests:', stats.totalRequests);
    console.log('Cache hits:', stats.cacheHits);
    console.log('Cache misses:', stats.cacheMisses);
    console.log('Hit rate:', (stats.cacheHits / stats.totalRequests * 100).toFixed(1) + '%');
    console.log('Total cost saved:', '$' + stats.totalSaved.toFixed(4));
}

testOptimization().catch(console.error);
