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

variable "domain_name" {
  description = "Domain name for the CloudFront distribution"
  type        = string
  default     = "athleteai.com"
}

variable "origin_domain" {
  description = "Origin domain (your load balancer or EC2 instance)"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS"
  type        = string
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "athleteai_oai" {
  comment = "OAI for AthleteAI S3 and API Gateway"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "athleteai_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "AthleteAI Global CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Use only North America and Europe for cost optimization

  # Origin for static assets (S3)
  origin {
    domain_name = aws_s3_bucket.athleteai_assets.bucket_regional_domain_name
    origin_id   = "S3-athleteai-assets"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.athleteai_oai.cloudfront_access_identity_path
    }
  }

  # Origin for API Gateway
  origin {
    domain_name = var.origin_domain
    origin_id   = "API-athleteai"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior for static assets
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-athleteai-assets"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400  # 24 hours
    max_ttl                = 31536000 # 1 year
    compress               = true

    # Cache based on content type
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.cache_optimizer.qualified_arn
      include_body = false
    }
  }

  # Cache behavior for API routes
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "API-athleteai"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies {
        forward = "whitelist"
        whitelisted_names = ["session", "auth"]
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0     # No caching for API by default
    max_ttl                = 3600  # 1 hour max for API responses
    compress               = true
  }

  # Cache behavior for athlete images
  ordered_cache_behavior {
    path_pattern     = "/uploads/athletes/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-athleteai-assets"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 3600   # 1 hour
    default_ttl            = 86400  # 24 hours
    max_ttl                = 604800 # 1 week
    compress               = true
  }

  # Geographic restrictions (optional)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL/TLS configuration
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Custom error pages
  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code         = 500
    response_code      = 500
    response_page_path = "/500.html"
    error_caching_min_ttl = 300
  }

  # Logging configuration
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

# S3 bucket for static assets
resource "aws_s3_bucket" "athleteai_assets" {
  bucket = "${var.domain_name}-assets"
  
  tags = {
    Environment = "production"
    Project     = "AthleteAI"
  }
}

# S3 bucket for CloudFront logs
resource "aws_s3_bucket" "athleteai_logs" {
  bucket = "${var.domain_name}-logs"
  
  tags = {
    Environment = "production"
    Project     = "AthleteAI"
  }
}

# S3 bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "athleteai_assets_policy" {
  bucket = aws_s3_bucket.athleteai_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.athleteai_oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.athleteai_assets.arn}/*"
      }
    ]
  })
}

# Lambda@Edge function for cache optimization
resource "aws_lambda_function" "cache_optimizer" {
  filename         = data.archive_file.cache_optimizer.output_path
  function_name    = "athleteai-cache-optimizer"
  role            = aws_iam_role.lambda_edge_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  publish         = true

  tags = {
    Environment = "production"
    Project     = "AthleteAI"
  }
}

# Lambda@Edge IAM role
resource "aws_iam_role" "lambda_edge_role" {
  name = "athleteai-lambda-edge-role"

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

# CloudFront invalidation for cache clearing
resource "aws_cloudfront_invalidation" "athleteai_invalidation" {
  distribution_id = aws_cloudfront_distribution.athleteai_cdn.id
  paths = ["/*"]
  
  # Only create on demand, not on every apply
  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.athleteai_cdn.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.athleteai_cdn.domain_name
}

output "s3_assets_bucket" {
  description = "S3 bucket for static assets"
  value       = aws_s3_bucket.athleteai_assets.bucket
}
