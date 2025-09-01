# Message Queue System for AthleteAI
# SQS queues and Lambda functions for async processing

# SQS Queues for different types of async operations
resource "aws_sqs_queue" "athlete_scraping_queue" {
  name                       = "athleteai-scraping-${var.environment}.fifo"
  fifo_queue                 = true
  content_based_deduplication = true
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention
  max_message_size          = 262144  # 256KB
  delay_seconds             = 0
  receive_wait_time_seconds = 0

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.athlete_scraping_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Queue"
    Purpose     = "Athlete Data Scraping"
  }
}

resource "aws_sqs_queue" "video_processing_queue" {
  name                       = "athleteai-video-processing-${var.environment}.fifo"
  fifo_queue                 = true
  content_based_deduplication = true
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention
  max_message_size          = 262144
  delay_seconds             = 0
  receive_wait_time_seconds = 0

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.video_processing_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Queue"
    Purpose     = "Video Processing"
  }
}

resource "aws_sqs_queue" "analytics_queue" {
  name                       = "athleteai-analytics-${var.environment}"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention
  max_message_size          = 262144
  delay_seconds             = 0
  receive_wait_time_seconds = 0

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.analytics_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Queue"
    Purpose     = "Analytics Processing"
  }
}

resource "aws_sqs_queue" "notification_queue" {
  name                       = "athleteai-notifications-${var.environment}"
  visibility_timeout_seconds = 30
  message_retention_seconds  = var.sqs_message_retention
  max_message_size          = 262144
  delay_seconds             = 0
  receive_wait_time_seconds = 0

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Queue"
    Purpose     = "User Notifications"
  }
}

# Dead Letter Queues
resource "aws_sqs_queue" "athlete_scraping_dlq" {
  name                       = "athleteai-scraping-dlq-${var.environment}.fifo"
  fifo_queue                 = true
  message_retention_seconds  = 1209600  # 14 days
  visibility_timeout_seconds = 30

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "DLQ"
  }
}

resource "aws_sqs_queue" "video_processing_dlq" {
  name                       = "athleteai-video-processing-dlq-${var.environment}.fifo"
  fifo_queue                 = true
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 30

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "DLQ"
  }
}

resource "aws_sqs_queue" "analytics_dlq" {
  name                       = "athleteai-analytics-dlq-${var.environment}"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 30

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "DLQ"
  }
}

resource "aws_sqs_queue" "notification_dlq" {
  name                       = "athleteai-notifications-dlq-${var.environment}"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 30

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "DLQ"
  }
}

# Lambda Functions for processing messages
resource "aws_lambda_function" "athlete_scraping_processor" {
  filename         = "lambda/scraping-processor.zip"
  function_name    = "athleteai-scraping-processor-${var.environment}"
  role            = aws_iam_role.lambda_sqs_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      MONGODB_URI     = var.mongodb_uri
      REDIS_URL       = var.redis_url
      SCRAPING_API_KEY = var.scraping_api_key
      ENVIRONMENT     = var.environment
    }
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Processor"
  }
}

resource "aws_lambda_function" "video_processing_processor" {
  filename         = "lambda/video-processor.zip"
  function_name    = "athleteai-video-processor-${var.environment}"
  role            = aws_iam_role.lambda_sqs_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      MONGODB_URI     = var.mongodb_uri
      REDIS_URL       = var.redis_url
      S3_BUCKET       = var.video_bucket
      ENVIRONMENT     = var.environment
    }
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Processor"
  }
}

resource "aws_lambda_function" "analytics_processor" {
  filename         = "lambda/analytics-processor.zip"
  function_name    = "athleteai-analytics-processor-${var.environment}"
  role            = aws_iam_role.lambda_sqs_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      MONGODB_URI     = var.mongodb_uri
      REDIS_URL       = var.redis_url
      ANALYTICS_DB    = var.analytics_db
      ENVIRONMENT     = var.environment
    }
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Processor"
  }
}

resource "aws_lambda_function" "notification_processor" {
  filename         = "lambda/notification-processor.zip"
  function_name    = "athleteai-notification-processor-${var.environment}"
  role            = aws_iam_role.lambda_sqs_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      SES_REGION      = var.region
      FROM_EMAIL      = var.from_email
      ENVIRONMENT     = var.environment
    }
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Processor"
  }
}

# Lambda Event Source Mappings
resource "aws_lambda_event_source_mapping" "scraping_queue_mapping" {
  event_source_arn = aws_sqs_queue.athlete_scraping_queue.arn
  function_name    = aws_lambda_function.athlete_scraping_processor.arn
  batch_size       = 1
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "video_queue_mapping" {
  event_source_arn = aws_sqs_queue.video_processing_queue.arn
  function_name    = aws_lambda_function.video_processing_processor.arn
  batch_size       = 1
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "analytics_queue_mapping" {
  event_source_arn = aws_sqs_queue.analytics_queue.arn
  function_name    = aws_lambda_function.analytics_processor.arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "notification_queue_mapping" {
  event_source_arn = aws_sqs_queue.notification_queue.arn
  function_name    = aws_lambda_function.notification_processor.arn
  batch_size       = 10
  enabled          = true
}

# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_sqs_role" {
  name = "athleteai-lambda-sqs-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda functions
resource "aws_iam_role_policy" "lambda_sqs_policy" {
  name = "athleteai-lambda-sqs-policy-${var.environment}"
  role = aws_iam_role.lambda_sqs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.athlete_scraping_queue.arn,
          aws_sqs_queue.video_processing_queue.arn,
          aws_sqs_queue.analytics_queue.arn,
          aws_sqs_queue.notification_queue.arn,
          aws_sqs_queue.athlete_scraping_dlq.arn,
          aws_sqs_queue.video_processing_dlq.arn,
          aws_sqs_queue.analytics_dlq.arn,
          aws_sqs_queue.notification_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.athleteai_videos.arn}/*",
          "${aws_s3_bucket.athleteai_analytics.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "docdb:DescribeDBClusters",
          "docdb:DescribeDBClusterParameterGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendTemplatedEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# S3 Buckets for video and analytics data
resource "aws_s3_bucket" "athleteai_videos" {
  bucket = "athleteai-videos-${var.environment}"

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Storage"
  }
}

resource "aws_s3_bucket" "athleteai_analytics" {
  bucket = "athleteai-analytics-${var.environment}"

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
    Type        = "Storage"
  }
}

# CloudWatch Alarms for Queue Monitoring
resource "aws_cloudwatch_metric_alarm" "scraping_queue_age" {
  alarm_name          = "athleteai-scraping-queue-age-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "3600"  # 1 hour
  alarm_description   = "Scraping queue has old messages"
  alarm_actions       = [aws_sns_topic.athleteai_alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.athlete_scraping_queue.name
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "athleteai-dlq-messages-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "10"
  alarm_description   = "Dead letter queue has messages"
  alarm_actions       = [aws_sns_topic.athleteai_alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.athlete_scraping_dlq.name
  }

  tags = {
    Environment = var.environment
    Project     = "AthleteAI"
  }
}

# Outputs
output "scraping_queue_url" {
  description = "Athlete scraping SQS queue URL"
  value       = aws_sqs_queue.athlete_scraping_queue.id
}

output "video_processing_queue_url" {
  description = "Video processing SQS queue URL"
  value       = aws_sqs_queue.video_processing_queue.id
}

output "analytics_queue_url" {
  description = "Analytics SQS queue URL"
  value       = aws_sqs_queue.analytics_queue.id
}

output "notification_queue_url" {
  description = "Notification SQS queue URL"
  value       = aws_sqs_queue.notification_queue.id
}

output "video_bucket_name" {
  description = "S3 bucket for video storage"
  value       = aws_s3_bucket.athleteai_videos.bucket
}

output "analytics_bucket_name" {
  description = "S3 bucket for analytics data"
  value       = aws_s3_bucket.athleteai_analytics.bucket
}
