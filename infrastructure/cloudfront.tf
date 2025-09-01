# CloudFront CDN Configuration for AthleteAI
# This Terraform configuration sets up CloudFront distribution for global performance

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# CloudFront Origin Access Identity for S3
resource "aws_cloudfront_origin_access_identity" "athleteai_oai" {
  comment = "OAI for AthleteAI static assets"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "athleteai_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "AthleteAI Global CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Use only US, Canada, Europe for cost optimization

  # Origin for API Gateway
  origin {
    domain_name = var.api_gateway_domain
    origin_id   = "api-gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Origin for Frontend (S3)
  origin {
    domain_name = aws_s3_bucket.athleteai_frontend.bucket_regional_domain_name
    origin_id   = "frontend-s3"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.athleteai_oai.cloudfront_access_identity_path
    }
  }

  # Default cache behavior for API
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-gateway"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "X-Amz-Date", "X-Amz-Security-Token"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    # Custom error responses for API
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.api_auth.qualified_arn
      include_body = true
    }
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend-s3"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400  # 1 day
    default_ttl            = 2592000 # 30 days
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  # Cache behavior for images
  ordered_cache_behavior {
    path_pattern     = "/*.jpg"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend-s3"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800  # 1 week
    max_ttl                = 2592000 # 30 days
    compress               = true
  }

  # Similar cache behavior for other static assets
  ordered_cache_behavior {
    path_pattern     = "/*.png"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend-s3"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 2592000
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/*.css"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend-s3"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 2592000
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/*.js"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend-s3"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 2592000
    compress               = true
  }

  # Custom error pages
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
    error_caching_min_ttl = 300
  }

  # SSL/TLS Configuration
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.athleteai_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Geo restrictions (optional)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # WAF integration
  web_acl_id = aws_wafv2_web_acl.athleteai_waf.arn

  # Logging
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.athleteai_logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  tags = {
    Environment = "production"
    Project     = "AthleteAI"
    ManagedBy   = "Terraform"
  }
}

# S3 bucket for frontend assets
resource "aws_s3_bucket" "athleteai_frontend" {
  bucket = "athleteai-frontend-${var.environment}"
  
  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# S3 bucket for logs
resource "aws_s3_bucket" "athleteai_logs" {
  bucket = "athleteai-logs-${var.environment}"
  
  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# SSL Certificate
resource "aws_acm_certificate" "athleteai_cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "athleteai_waf" {
  name        = "athleteai-waf-${var.environment}"
  description = "WAF for AthleteAI protection"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 10000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
      sampled_requests_enabled   = true
    }
  }

  # SQL injection protection
  rule {
    name     = "SQLInjection"
    priority = 2

    action {
      block {}
    }

    statement {
      sqli_match_statement {
        field_to_match {
          all_query_arguments {}
        }
        text_transformation {
          priority = 1
          type     = "URL_DECODE"
        }
        text_transformation {
          priority = 2
          type     = "LOWERCASE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjection"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "AthleteAIWAF"
    sampled_requests_enabled   = true
  }
}

# Lambda@Edge for API authentication
resource "aws_lambda_function" "api_auth" {
  filename         = "lambda/auth.zip"
  function_name    = "athleteai-api-auth-${var.environment}"
  role            = aws_iam_role.lambda_edge_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  publish         = true

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# IAM role for Lambda@Edge
resource "aws_iam_role" "lambda_edge_role" {
  name = "athleteai-lambda-edge-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
}

# Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.athleteai_cdn.id
}

output "cloudfront_domain_name" {
  description = "CloudFront Domain Name"
  value       = aws_cloudfront_distribution.athleteai_cdn.domain_name
}

output "s3_bucket_name" {
  description = "S3 Bucket for frontend assets"
  value       = aws_s3_bucket.athleteai_frontend.bucket
}
