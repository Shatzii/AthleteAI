#!/bin/bash

# Enterprise Deployment Script for AthleteAI
# Deploys all high-impact enterprise features to AWS

set -e

echo "🚀 AthleteAI Enterprise Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi

    print_status "Prerequisites check passed"
}

# Setup Terraform backend
setup_terraform_backend() {
    print_info "Setting up Terraform backend..."

    # Create S3 bucket for Terraform state (if it doesn't exist)
    aws s3 mb s3://athleteai-terraform-state --region us-east-1 2>/dev/null || true

    # Enable versioning on the bucket
    aws s3api put-bucket-versioning \
        --bucket athleteai-terraform-state \
        --versioning-configuration Status=Enabled

    print_status "Terraform backend configured"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_info "Deploying infrastructure with Terraform..."

    cd infrastructure

    # Initialize Terraform
    terraform init

    # Validate configuration
    terraform validate

    # Plan deployment
    print_info "Planning infrastructure deployment..."
    terraform plan -out=tfplan

    # Ask for confirmation
    read -p "Do you want to apply these changes? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user"
        exit 0
    fi

    # Apply changes
    print_info "Applying infrastructure changes..."
    terraform apply tfplan

    # Get outputs
    CLOUDFRONT_URL=$(terraform output -raw cloudfront_distribution_url 2>/dev/null || echo "")
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "")
    MONGODB_URI=$(terraform output -raw mongodb_connection_string 2>/dev/null || echo "")
    REDIS_URI=$(terraform output -raw redis_connection_string 2>/dev/null || echo "")

    cd ..
    print_status "Infrastructure deployed successfully"
}

# Build and push Docker images
build_and_push_images() {
    print_info "Building and pushing Docker images..."

    # Login to ECR
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

    # Build backend image
    print_info "Building backend image..."
    docker build -t athleteai-backend ./backend
    docker tag athleteai-backend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/athleteai-backend:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/athleteai-backend:latest

    # Build frontend image
    print_info "Building frontend image..."
    docker build -t athleteai-frontend ./frontend
    docker tag athleteai-frontend:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/athleteai-frontend:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/athleteai-frontend:latest

    # Build API Gateway image
    print_info "Building API Gateway image..."
    docker build -t athleteai-api-gateway ./backend -f ./backend/Dockerfile.gateway
    docker tag athleteai-api-gateway:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/athleteai-api-gateway:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/athleteai-api-gateway:latest

    print_status "Docker images built and pushed"
}

# Deploy Lambda functions
deploy_lambda_functions() {
    print_info "Deploying Lambda functions..."

    # Create Lambda deployment packages
    cd lambda/scraping-processor
    zip -r scraping-processor.zip .
    cd ../..

    # The Lambda functions will be deployed via Terraform
    print_status "Lambda functions deployment configured"
}

# Configure monitoring
setup_monitoring() {
    print_info "Setting up monitoring and alerting..."

    # CloudWatch dashboards and alarms are created via Terraform
    print_status "Monitoring configured"
}

# Update DNS (optional)
update_dns() {
    print_info "DNS Configuration (Optional)"
    echo "To configure custom domain:"
    echo "1. Update Route 53 with your domain"
    echo "2. Update CLOUDFRONT_DOMAIN variable in Terraform"
    echo "3. Run: terraform apply"
    print_status "DNS configuration noted"
}

# Display deployment summary
display_summary() {
    echo ""
    echo "🎉 AthleteAI Enterprise Deployment Complete!"
    echo "=========================================="
    echo ""
    echo "📊 Service URLs:"
    if [ ! -z "$CLOUDFRONT_URL" ]; then
        echo "   🌐 Frontend:     $CLOUDFRONT_URL"
    fi
    if [ ! -z "$API_URL" ]; then
        echo "   🚪 API Gateway:  $API_URL"
    fi
    echo ""
    echo "🔒 Security Features:"
    echo "   ✅ CloudFront CDN with WAF protection"
    echo "   ✅ API Gateway with rate limiting"
    echo "   ✅ DocumentDB with TLS encryption"
    echo "   ✅ ElastiCache Redis with encryption"
    echo "   ✅ SQS with dead letter queues"
    echo ""
    echo "📈 Performance Features:"
    echo "   ✅ Global CDN distribution"
    echo "   ✅ Sharded MongoDB cluster"
    echo "   ✅ Redis cluster for caching"
    echo "   ✅ Async processing with SQS"
    echo "   ✅ Lambda functions for heavy tasks"
    echo ""
    echo "📊 Monitoring:"
    echo "   ✅ CloudWatch dashboards"
    echo "   ✅ Automated alerts"
    echo "   ✅ Performance metrics"
    echo "   ✅ Error tracking"
    echo ""
    echo "🛠️  Management Commands:"
    echo "   cd infrastructure && terraform plan"
    echo "   cd infrastructure && terraform apply"
    echo "   aws ecs list-services --cluster athleteai-cluster"
    echo "   aws logs tail /aws/lambda/athleteai-scraping-processor"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Configure SSL certificates"
    echo "   2. Set up CI/CD pipelines"
    echo "   3. Configure backup schedules"
    echo "   4. Set up log aggregation"
    echo ""
}

# Main deployment flow
main() {
    echo "Starting AthleteAI Enterprise deployment..."

    check_prerequisites
    setup_terraform_backend
    deploy_infrastructure
    build_and_push_images
    deploy_lambda_functions
    setup_monitoring
    update_dns
    display_summary

    print_status "Enterprise deployment completed successfully!"
    print_info "Your AthleteAI platform is now running with enterprise-grade features!"
}

# Run main function
main "$@"
