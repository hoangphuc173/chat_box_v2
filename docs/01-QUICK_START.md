# Quick Start - Deploy ChatBox1 (Windows)

## Bước 1: Configure AWS CLI

```powershell
aws configure

# Nhập:
AWS Access Key ID: YOUR_AWS_ACCESS_KEY_ID
AWS Secret Access Key: YOUR_AWS_SECRET_ACCESS_KEY
Default region name: ap-southeast-1
Default output format: json
```

## Bước 2: Tạo username-index cho Users table

```powershell
cd scripts
.\setup_aws.ps1
```

**Hoặc chạy trực tiếp:**
```powershell
aws dynamodb update-table --table-name Users --region ap-southeast-1 --attribute-definitions AttributeName=username,AttributeType=S --global-secondary-index-updates "[{`"Create`":{`"IndexName`":`"username-index`",`"KeySchema`":[{`"AttributeName`":`"username`",`"KeyType`":`"HASH`"}],`"Projection`":{`"ProjectionType`":`"ALL`"},`"ProvisionedThroughput`":{`"ReadCapacityUnits`":5,`"WriteCapacityUnits`":5}}}]"
```

## Bước 3: Verify

```powershell
# List tables
aws dynamodb list-tables --region ap-southeast-1

# Check Users table GSI
aws dynamodb describe-table --table-name Users --region ap-southeast-1 --query "Table.GlobalSecondaryIndexes[].IndexName"
```

## ✅ Sau khi setup xong AWS:

**Backend cần build trên Linux/EC2 (không thể build trên Windows)**

**Option 1: Build trên EC2 luôn**
```powershell
# SSH to EC2
ssh -i chat-server-key.pem ubuntu@47.129.136.101

# Install dependencies
sudo apt update
sudo apt install -y cmake build-essential libssl-dev libcurl4-openssl-dev

# Upload code to EC2 first
```

**Option 2: Dùng WSL (Windows Subsystem for Linux)**
```powershell
# Install WSL
wsl --install

# Inside WSL, build server
cd /mnt/c/Users/ADMIN/Downloads/ChatBox\ web/backend/server
mkdir build && cd build
cmake ..
make
```

## 🎯 Tôi Recommend:

**Skip building locally → Deploy code to EC2 → Build on EC2**

Tôi có thể hướng dẫn bạn:
1. Upload code to EC2
2. Build on EC2
3. Run server

**Bạn muốn tôi làm cách nào?**
