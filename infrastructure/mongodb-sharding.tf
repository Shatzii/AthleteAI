# MongoDB Sharding Configuration for AthleteAI
# This sets up a sharded MongoDB cluster for horizontal scaling

# DocumentDB Cluster (AWS managed MongoDB-compatible)
resource "aws_docdb_cluster" "athleteai_mongodb" {
  cluster_identifier      = "athleteai-mongodb-${var.environment}"
  engine                  = "docdb"
  master_username         = var.docdb_master_username
  master_password         = var.docdb_master_password
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
  
  # Enable deletion protection in production
  deletion_protection = var.environment == "prod" ? true : false
  
  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Database"
  }
}

# DocumentDB Cluster Instances (Shard nodes)
resource "aws_docdb_cluster_instance" "athleteai_mongodb_instances" {
  count              = var.mongo_cluster_size
  identifier         = "athleteai-mongodb-${var.environment}-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.athleteai_mongodb.id
  instance_class     = var.mongo_instance_class
  
  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Database"
    Shard       = "shard-${count.index + 1}"
  }
}

# DocumentDB Subnet Group
resource "aws_docdb_subnet_group" "athleteai_mongodb" {
  name       = "athleteai-mongodb-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# DocumentDB Parameter Group for sharding optimization
resource "aws_docdb_cluster_parameter_group" "athleteai_mongodb" {
  family = "docdb4.0"
  name   = "athleteai-mongodb-${var.environment}"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  parameter {
    name  = "audit_logs"
    value = "enabled"
  }

  # Performance optimization parameters
  parameter {
    name  = "profiler"
    value = "slow-op"
  }

  parameter {
    name  = "profiler_threshold_ms"
    value = "100"
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# ElastiCache Redis Cluster for enhanced caching
resource "aws_elasticache_cluster" "athleteai_redis" {
  cluster_id           = "athleteai-redis-${var.environment}"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_clusters
  parameter_group_name = "default.redis6.x"
  port                 = 6379
  
  # Multi-AZ for high availability
  az_mode = var.redis_num_cache_clusters > 1 ? "cross-az" : "single-az"
  
  # Security
  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = aws_elasticache_subnet_group.athleteai_redis.name
  
  # Maintenance
  maintenance_window = "sun:05:00-sun:09:00"
  snapshot_window    = "00:00-05:00"
  
  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Cache"
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "athleteai_redis" {
  name       = "athleteai-redis-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# Security Groups
resource "aws_security_group" "mongodb" {
  name_prefix = "athleteai-mongodb-${var.environment}"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "athleteai-redis-${var.environment}"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# ECS Security Group (referenced above)
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "athleteai-ecs-tasks-${var.environment}"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# CloudWatch Alarms for Database Monitoring
resource "aws_cloudwatch_metric_alarm" "mongodb_cpu_utilization" {
  alarm_name          = "athleteai-mongodb-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/DocDB"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "MongoDB CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.athleteai_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_docdb_cluster.athleteai_mongodb.cluster_identifier
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

resource "aws_cloudwatch_metric_alarm" "mongodb_freeable_memory" {
  alarm_name          = "athleteai-mongodb-memory-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "FreeableMemory"
  namespace           = "AWS/DocDB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000000000"  # 1GB in bytes
  alarm_description   = "MongoDB freeable memory is too low"
  alarm_actions       = [aws_sns_topic.athleteai_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_docdb_cluster.athleteai_mongodb.cluster_identifier
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu_utilization" {
  alarm_name          = "athleteai-redis-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Redis CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.athleteai_alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.athleteai_redis.cluster_id
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "athleteai_alerts" {
  name = "athleteai-alerts-${var.environment}"

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# Outputs
output "mongodb_cluster_endpoint" {
  description = "MongoDB cluster endpoint"
  value       = aws_docdb_cluster.athleteai_mongodb.endpoint
}

output "mongodb_reader_endpoint" {
  description = "MongoDB reader endpoint"
  value       = aws_docdb_cluster.athleteai_mongodb.reader_endpoint
}

output "redis_cluster_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_cluster.athleteai_redis.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_cluster.athleteai_redis.port
}
