// Lambda@Edge function for CloudFront cache optimization
// This function optimizes caching based on content type and request patterns

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    const uri = request.uri;
    
    // Add cache control headers based on content type
    if (uri.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        // Static assets - long cache
        headers['cache-control'] = [{
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
        }];
    } else if (uri.match(/\.(html|json)$/)) {
        // HTML/JSON - short cache
        headers['cache-control'] = [{
            key: 'Cache-Control',
            value: 'public, max-age=300, must-revalidate'
        }];
    } else if (uri.startsWith('/api/')) {
        // API responses - conditional cache
        const userAgent = headers['user-agent'] ? headers['user-agent'][0].value : '';
        
        // Don't cache for authenticated requests
        if (headers.authorization || headers.cookie) {
            headers['cache-control'] = [{
                key: 'Cache-Control',
                value: 'private, no-cache, no-store'
            }];
        } else {
            // Cache public API responses
            headers['cache-control'] = [{
                key: 'Cache-Control',
                value: 'public, max-age=600, s-maxage=3600'
            }];
        }
    }
    
    // Add security headers
    headers['x-content-type-options'] = [{
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    }];
    
    headers['x-frame-options'] = [{
        key: 'X-Frame-Options',
        value: 'DENY'
    }];
    
    headers['x-xss-protection'] = [{
        key: 'X-XSS-Protection',
        value: '1; mode=block'
    }];
    
    // Add performance headers
    headers['strict-transport-security'] = [{
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
    }];
    
    callback(null, request);
};
