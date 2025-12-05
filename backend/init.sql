-- Initialize database
CREATE DATABASE IF NOT EXISTS wedding_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE wedding_db;

-- Set character set for connection
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Grant privileges
GRANT ALL PRIVILEGES ON wedding_db.* TO 'wedding_user'@'%';
FLUSH PRIVILEGES;
