#!/bin/bash

# Monitor Railway deployment status
URL="https://mindful-forgiveness-production-b7f8.up.railway.app"
HEALTH_URL="$URL/api/health"

echo "🔍 Monitoring Railway deployment for Afelu Guardian..."
echo "📍 URL: $URL"
echo "🏥 Health check: $HEALTH_URL"
echo ""

attempts=0
max_attempts=30
sleep_time=10

while [ $attempts -lt $max_attempts ]; do
    attempts=$((attempts + 1))
    echo "🔄 Attempt $attempts/$max_attempts..."
    
    # Test health endpoint
    response=$(curl -s -w "%{http_code}" "$HEALTH_URL" -o /tmp/health_response.json)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ SUCCESS! Application is healthy!"
        echo "📊 Health response:"
        cat /tmp/health_response.json | jq '.' 2>/dev/null || cat /tmp/health_response.json
        echo ""
        echo "🎉 Your Afelu Guardian homepage is now live at:"
        echo "🔗 $URL"
        exit 0
    elif [ "$http_code" = "404" ]; then
        echo "⏳ Application not found yet (404) - still building/deploying..."
    else
        echo "⚠️  Got HTTP $http_code - checking response..."
        cat /tmp/health_response.json 2>/dev/null || echo "No response body"
    fi
    
    if [ $attempts -lt $max_attempts ]; then
        echo "⏸️  Waiting ${sleep_time}s before next attempt..."
        sleep $sleep_time
    fi
done

echo "❌ Deployment monitoring timed out after $((max_attempts * sleep_time)) seconds"
echo "💡 Check Railway dashboard for deployment status"
echo "🔗 https://railway.app/project/afelu-guardian"
