# ChatBox v2 - Production Deployment Guide

## Thông tin Server
- **IP**: 103.56.163.137
- **Port SSH**: 24700
- **User**: root
- **OS**: Ubuntu 22.04

## Chuẩn bị

### 1. Cấu hình Environment Variables
Chỉnh sửa file `.env.production` với các giá trị bảo mật:

```bash
nano .env.production
```

Thay đổi các giá trị sau:
- `MYSQL_ROOT_PASSWORD`: Mật khẩu root của MySQL
- `MYSQL_PASSWORD`: Mật khẩu user chatbox
- `JWT_SECRET`: Secret key cho JWT (dùng string dài và random)
- `GEMINI_API_KEY`: API key của Gemini AI (nếu có)

### 2. Deploy lên Server

**Cách 1: Sử dụng script tự động**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Cách 2: Deploy thủ công**

#### Bước 1: Copy files lên server
```bash
# Tạo package
tar czf chatbox.tar.gz backend/ frontend/ docker-compose.prod.yml .env.production

# Upload lên server
scp -P 24700 chatbox.tar.gz root@103.56.163.137:/opt/

# SSH vào server
ssh -p 24700 root@103.56.163.137
```

#### Bước 2: Cài đặt Docker (nếu chưa có)
```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### Bước 3: Extract và chạy
```bash
cd /opt
tar xzf chatbox.tar.gz
cd chatbox

# Build và start containers
docker-compose -f docker-compose.prod.yml up -d --build
```

## Quản lý Application

### Xem logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f mysql
```

### Restart services
```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Stop/Start
```bash
# Stop
docker-compose -f docker-compose.prod.yml stop

# Start
docker-compose -f docker-compose.prod.yml start

# Stop and remove containers
docker-compose -f docker-compose.prod.yml down
```

### Update application
```bash
# Pull latest code (if using git)
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## Cấu hình Firewall

### UFW (Ubuntu)
```bash
# Allow SSH
ufw allow 24700/tcp

# Allow HTTP (frontend)
ufw allow 80/tcp

# Allow WebSocket (backend)
ufw allow 8080/tcp

# Enable firewall
ufw enable
```

### Firewalld (CentOS/RHEL)
```bash
firewall-cmd --permanent --add-port=24700/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload
```

## Truy cập Application

- **Frontend**: http://103.56.163.137
- **Backend WebSocket**: ws://103.56.163.137:8080

## Troubleshooting

### Container không start
```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check system resources
docker stats
```

### Database connection issues
```bash
# Check MySQL is running
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# Check MySQL logs
docker-compose -f docker-compose.prod.yml logs mysql
```

### Port conflicts
```bash
# Check what's using the ports
netstat -tulpn | grep :80
netstat -tulpn | grep :8080
netstat -tulpn | grep :3306
```

## Backup Database

### Manual backup
```bash
docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p chatbox_db > backup_$(date +%Y%m%d).sql
```

### Restore backup
```bash
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p chatbox_db < backup.sql
```

## SSL/HTTPS Setup (Optional)

### Using Nginx as reverse proxy
```bash
# Install Nginx
apt install nginx

# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com

# Configure Nginx (see nginx.conf.example)
```

## Monitoring

### Check disk space
```bash
df -h
docker system df
```

### Clean up unused Docker resources
```bash
docker system prune -a
```

### Monitor containers
```bash
docker stats
```

## Security Recommendations

1. ✅ Change default passwords in `.env.production`
2. ✅ Use strong JWT_SECRET
3. ✅ Configure firewall
4. ✅ Set up SSL/HTTPS
5. ✅ Regular backups
6. ✅ Keep Docker and system updated
7. ✅ Monitor logs regularly
8. ✅ Limit MySQL access to localhost only

## Support

Nếu gặp vấn đề, check logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```
