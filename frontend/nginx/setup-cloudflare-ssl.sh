#!/bin/bash

# Setup Cloudflare Origin Certificate for Nginx
# Run this on your server

echo "=== Wedding Innovation - Cloudflare SSL Setup ==="
echo ""

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

echo "Step 1: Create Cloudflare Origin Certificate"
echo "============================================="
echo "1. Go to Cloudflare Dashboard"
echo "2. Select your domain: hoangdieuit.io.vn"
echo "3. Go to SSL/TLS > Origin Server"
echo "4. Click 'Create Certificate'"
echo "5. Select:"
echo "   - Private key type: RSA (2048)"
echo "   - Hostnames: *.hoangdieuit.io.vn, hoangdieuit.io.vn"
echo "   - Certificate Validity: 15 years (recommended)"
echo "6. Click 'Create'"
echo "7. Copy the Origin Certificate (PEM format)"
echo ""

read -p "Paste your Origin Certificate here (end with Ctrl+D): " -d $'\04' CERT
echo "$CERT" | sudo tee /etc/nginx/ssl/cloudflare-origin.pem > /dev/null

echo ""
echo "8. Copy the Private Key"
echo ""

read -p "Paste your Private Key here (end with Ctrl+D): " -d $'\04' KEY
echo "$KEY" | sudo tee /etc/nginx/ssl/cloudflare-origin-key.pem > /dev/null

# Set permissions
sudo chmod 600 /etc/nginx/ssl/cloudflare-origin-key.pem
sudo chmod 644 /etc/nginx/ssl/cloudflare-origin.pem

echo ""
echo "Step 2: Cloudflare DNS Settings"
echo "================================"
echo "In Cloudflare DNS, add these records:"
echo ""
echo "Type | Name | Content        | Proxy"
echo "-----|------|----------------|-------"
echo "A    | @    | YOUR_SERVER_IP | Proxied (Orange)"
echo "A    | *    | YOUR_SERVER_IP | Proxied (Orange)"
echo ""

echo "Step 3: Cloudflare SSL/TLS Settings"
echo "===================================="
echo "1. Go to SSL/TLS > Overview"
echo "2. Set encryption mode to: Full (strict)"
echo "3. Go to Edge Certificates"
echo "4. Enable: Always Use HTTPS"
echo "5. Enable: Automatic HTTPS Rewrites"
echo ""

echo "Step 4: Copy Nginx Config"
echo "========================="
echo "sudo cp nginx.conf /etc/nginx/sites-available/wedding"
echo "sudo ln -sf /etc/nginx/sites-available/wedding /etc/nginx/sites-enabled/"
echo "sudo rm -f /etc/nginx/sites-enabled/default"
echo "sudo nginx -t"
echo "sudo systemctl reload nginx"
echo ""

echo "=== Setup Complete! ==="
