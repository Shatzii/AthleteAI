# Main Terraform configuration for AthleteAI Enterprise Infrastructure
# This file orchestrates all infrastructure components

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  # Uncomment for production use
  # backend "s3" {
  #   bucket = "athleteai-terraform-state"
  #   key    = "infrastructure/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "AthleteAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  environment = var.environment
  region      = var.region
}

# Database Infrastructure
module "database" {
  source = "./modules/database"

  environment         = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  docdb_master_username = var.docdb_master_username
  docdb_master_password = var.docdb_master_password
  mongo_instance_class  = var.mongo_instance_class
  mongo_cluster_size    = var.mongo_cluster_size

  redis_node_type         = var.redis_node_type
  redis_num_cache_clusters = var.redis_num_cache_clusters
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"

  environment         = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  ecs_task_cpu    = var.ecs_task_cpu
  ecs_task_memory = var.ecs_task_memory
  ecs_desired_count = var.ecs_desired_count

  mongodb_endpoint = module.database.mongodb_endpoint
  redis_endpoint   = module.database.redis_endpoint
}

# Message Queue System
module "message_queue" {
  source = "./modules/message-queue"

  environment = var.environment

  sqs_visibility_timeout = var.sqs_visibility_timeout
  sqs_message_retention  = var.sqs_message_retention
  sqs_max_receive_count  = var.sqs_max_receive_count

  lambda_timeout    = var.lambda_timeout
  lambda_memory_size = var.lambda_memory_size

  mongodb_uri     = module.database.mongodb_endpoint
  redis_url       = module.database.redis_endpoint
  video_bucket    = module.storage.video_bucket_name
  analytics_db    = "athleteai_analytics_${var.environment}"
  from_email      = var.from_email
  scraping_api_key = var.scraping_api_key
}

# CloudFront CDN
module "cdn" {
  source = "./modules/cdn"

  environment     = var.environment
  domain_name     = var.domain_name
  api_gateway_domain = "api.${var.domain_name}"

  frontend_bucket = module.storage.frontend_bucket_name
  api_gateway_id  = module.ecs.api_gateway_id
}

# Storage (S3 buckets)
module "storage" {
  source = "./modules/storage"

  environment = var.environment
}

# Monitoring and Alerting
module "monitoring" {
  source = "./modules/monitoring"

  environment = var.environment

  log_retention_days     = var.log_retention_days
  alarm_evaluation_periods = var.alarm_evaluation_periods
  alarm_datapoints_to_alarm = var.alarm_datapoints_to_alarm

  mongodb_cluster_id = module.database.mongodb_cluster_id
  redis_cluster_id   = module.database.redis_cluster_id
  ecs_cluster_name   = module.ecs.cluster_name
}

# Outputs
output "cloudfront_distribution_url" {
  description = "CloudFront distribution URL"
  value       = module.cdn.cloudfront_distribution_url
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.ecs.api_gateway_url
}

output "mongodb_connection_string" {
  description = "MongoDB connection string"
  value       = module.database.mongodb_connection_string
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = module.database.redis_connection_string
  sensitive   = true
}

output "scraping_queue_url" {
  description = "SQS scraping queue URL"
  value       = module.message_queue.scraping_queue_url
}

output "video_processing_queue_url" {
  description = "SQS video processing queue URL"
  value       = module.message_queue.video_processing_queue_url
}

output "analytics_queue_url" {
  description = "SQS analytics queue URL"
  value       = module.message_queue.analytics_queue_url
}

output "notification_queue_url" {
  description = "SQS notification queue URL"
  value       = module.message_queue.notification_queue_url
}
