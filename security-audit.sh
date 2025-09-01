#!/bin/bash

# Security Audit Script for Go4It Sports Platform
# Run this script to check for common security issues

echo "🔒 Go4It Sports Platform - Security Audit"
echo "=========================================="

# Check if .env file exists and has secure values
echo ""
echo "1. Environment Variables Check:"
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Check for placeholder values
if grep -q "your-super-secret" .env; then
    echo "❌ .env contains placeholder secrets!"
    exit 1
fi

if grep -q "changeme" .env; then
    echo "❌ .env contains 'changeme' passwords!"
    exit 1
fi

echo "✅ Environment variables look secure"

# Check file permissions
echo ""
echo "2. File Permissions Check:"
if [ -w ".env" ]; then
    echo "⚠️  .env file is world-writable. Consider: chmod 600 .env"
fi

# Check for sensitive files that shouldn't be committed
echo ""
echo "3. Sensitive Files Check:"
sensitive_files=(".env" "*.key" "*.pem" "id_rsa" "secrets.json")

for file in "${sensitive_files[@]}"; do
    if [ -f "$file" ]; then
        echo "⚠️  Found sensitive file: $file"
    fi
done

# Check dependencies for vulnerabilities
echo ""
echo "4. Dependencies Check:"
if command -v npm &> /dev/null; then
    echo "Checking backend dependencies..."
    cd backend
    npm audit --audit-level=moderate > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Backend dependencies are secure"
    else
        echo "⚠️  Backend has dependency vulnerabilities"
    fi
    cd ..
fi

# Check for common security issues in code
echo ""
echo "5. Code Security Check:"
echo "Checking for hardcoded secrets..."
if grep -r "password.*=.*['\"]" --include="*.js" --exclude-dir=node_modules . | grep -v "process.env" | grep -v "bcrypt"; then
    echo "⚠️  Found potential hardcoded passwords"
fi

echo "Checking for console.log statements..."
if grep -r "console.log" --include="*.js" --exclude-dir=node_modules . | head -5; then
    echo "⚠️  Found console.log statements (remove in production)"
fi

# Check for proper error handling
echo ""
echo "6. Error Handling Check:"
if grep -r "throw.*error" --include="*.js" --exclude-dir=node_modules . | head -3; then
    echo "⚠️  Found unhandled error throws"
fi

echo ""
echo "🎉 Security audit completed!"
echo ""
echo "Next steps:"
echo "- Review and fix any warnings above"
echo "- Run 'npm audit fix' to fix dependency vulnerabilities"
echo "- Set up automated security scanning in CI/CD"
echo "- Configure monitoring and alerting"
echo "- Regular security updates and patches"
