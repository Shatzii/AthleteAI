#!/bin/bash
# deploy.sh
#!/bin/bash
set -e

echo "🚀 Starting Go4It Sports Platform deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Validate environment
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "❌ SESSION_SECRET is not set"
    exit 1
fi

# Create deployment directory
DEPLOY_DIR="/opt/go4it"
echo "📁 Preparing deployment files in $DEPLOY_DIR..."
sudo mkdir -p $DEPLOY_DIR
sudo chown -R $USER:$USER $DEPLOY_DIR

# Build frontend
echo "📦 Building frontend application..."
cd frontend
npm ci --silent
npm run build
cd ..

# Build backend
echo "📦 Building backend application..."
cd backend
npm ci --silent --production
npm run build
cd ..

# Copy files
echo "📋 Copying deployment files..."
cp -r frontend/build $DEPLOY_DIR/frontend/
cp -r backend/dist $DEPLOY_DIR/backend/
cp -r backend/package.json $DEPLOY_DIR/backend/
cp -r backend/package-lock.json $DEPLOY_DIR/backend/
cp docker-compose.prod.yml $DEPLOY_DIR/
cp .env $DEPLOY_DIR/
cp ecosystem.config.js $DEPLOY_DIR/

# Setup Docker
echo "🐳 Setting up Docker containers..."
cd $DEPLOY_DIR
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate

# Setup PM2 for process management
echo "⚙️ Configuring PM2..."
npm install -g pm2
pm2 delete go4it-server 2>/dev/null || true

# Create ecosystem file with environment variables
cat > $DEPLOY_DIR/ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'go4it-server',
    script: './backend/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: '${DATABASE_URL}',
      SESSION_SECRET: '${SESSION_SECRET}',
      REDIS_URL: 'redis://localhost:6379'
    },
    error_file: '/var/log/go4it/err.log',
    out_file: '/var/log/go4it/out.log',
    log_file: '/var/log/go4it/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    instance_var: 'INSTANCE_ID',
  }]
};
EOL

pm2 start $DEPLOY_DIR/ecosystem.config.js
pm2 save
pm2 startup

# Setup log rotation
echo "📝 Setting up log rotation..."
sudo mkdir -p /var/log/go4it
sudo chown -R $USER:$USER /var/log/go4it

# Setup SSL with Let's Encrypt (if domain is set)
if [ ! -z "$DOMAIN" ]; then
    echo "🔐 Setting up SSL certificate..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    
    if sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos; then
        echo "✅ SSL certificate installed"
    else
        echo "⚠️ SSL certificate setup failed, continuing without SSL"
    fi
fi

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw --force enable

# Setup monitoring
echo "📊 Setting up monitoring..."
curl -s https://raw.githubusercontent.com/nginxinc/nginx-amplify-agent/master/packages/install.sh | sudo sh

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at https://${DOMAIN:-localhost}"
echo "📊 PM2 status: pm2 status"
echo "📋 Logs: tail -f /var/log/go4it/combined.log"