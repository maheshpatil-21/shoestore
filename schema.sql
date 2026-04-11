-- ============================================
-- ShoeStore MySQL Schema
-- Run this file to set up your database:
--   mysql -u root -p < schema.sql
-- ============================================

-- Create and use the database
CREATE DATABASE IF NOT EXISTS shoestore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shoestore;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  phone         VARCHAR(20)     DEFAULT NULL,
  address       TEXT            DEFAULT NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id             INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(200)    NOT NULL,
  category       VARCHAR(80)     NOT NULL,
  description    TEXT            DEFAULT NULL,
  price          DECIMAL(10,2)   NOT NULL,
  original_price DECIMAL(10,2)   DEFAULT NULL,  -- null = no discount shown
  image          VARCHAR(500)    DEFAULT NULL,
  stock          INT UNSIGNED    NOT NULL DEFAULT 0,
  rating         DECIMAL(2,1)    NOT NULL DEFAULT 0.0,
  review_count   INT UNSIGNED    NOT NULL DEFAULT 0,
  badge          VARCHAR(50)     DEFAULT NULL,   -- e.g. 'New', 'Sale', 'Best Seller'
  is_active      TINYINT(1)      NOT NULL DEFAULT 1,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_category  (category),
  INDEX idx_price     (price),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id                INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED    DEFAULT NULL,  -- null = guest order
  total_price       DECIMAL(10,2)   NOT NULL,
  status            ENUM('pending','processing','shipped','delivered','cancelled')
                    NOT NULL DEFAULT 'pending',
  -- Shipping details (denormalized for historical accuracy)
  shipping_name     VARCHAR(200)    DEFAULT NULL,
  shipping_email    VARCHAR(150)    DEFAULT NULL,
  shipping_address  TEXT            DEFAULT NULL,
  shipping_city     VARCHAR(100)    DEFAULT NULL,
  shipping_zip      VARCHAR(20)     DEFAULT NULL,
  shipping_country  VARCHAR(80)     DEFAULT NULL,
  payment_method    VARCHAR(50)     DEFAULT 'card',
  notes             TEXT            DEFAULT NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_order_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_user_id    (user_id),
  INDEX idx_status     (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED    NOT NULL,
  product_id   INT UNSIGNED    DEFAULT NULL,  -- null if product was later deleted
  product_name VARCHAR(200)    NOT NULL,       -- snapshot at time of purchase
  size         VARCHAR(20)     DEFAULT NULL,
  quantity     INT UNSIGNED    NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2)   NOT NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_item_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_item_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_order_id   (order_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA — Products
-- ============================================
INSERT INTO products (name, category, price, original_price, image, stock, rating, review_count, badge, description) VALUES
('AeroStride Pro',     'Running',    129.99, 159.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 15, 4.8, 124, 'Best Seller', 'Premium running shoes engineered for maximum performance. Featuring advanced foam cushioning and breathable mesh upper.'),
('UrbanWalker Classic','Casual',      89.99,   NULL, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600', 22, 4.5,  89, 'New',         'Timeless casual sneakers for everyday wear. Crafted with premium leather and cushioned insoles for all-day comfort.'),
('SportFlex Elite',    'Training',   109.99, 139.99, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',  8, 4.6,  67, 'Sale',        'Built for high-intensity training sessions. Flexible sole and supportive ankle structure for optimal performance.'),
('CloudStep Loafer',   'Formal',     149.99,   NULL, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600', 12, 4.9,  45, NULL,          'Sophisticated loafers for the modern professional. Premium suede finish with memory foam cushioning.'),
('TrailBlazer X',      'Hiking',     169.99, 199.99, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',  5, 4.7, 203, 'Sale',        'Conquer any terrain with TrailBlazer X. Waterproof, grippy and built to last through any adventure.'),
('SlimFit Canvas',     'Casual',      59.99,   NULL, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600', 30, 4.3, 156, 'New',         'Lightweight canvas sneakers with a slim profile. Perfect for casual outings and weekend adventures.'),
('MaxCush Runner',     'Running',    139.99, 169.99, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 18, 4.6,  88, 'Sale',        'Maximum cushioning for long-distance runners. Engineered heel support and energy-return foam.'),
('Street Court Hi',    'Basketball', 119.99,   NULL, 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600', 14, 4.4,  72, NULL,          'High-top basketball shoes with ankle support and court grip. Dominate the court with style.');

-- ============================================
-- SEED DATA — Admin User
-- password = admin123 (bcrypt hash)
-- ============================================
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@shoestore.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HxQBOmu', 'admin');
-- Note: Generate a fresh hash with: node -e "const b=require('bcryptjs');b.hash('admin123',12).then(console.log)"

-- ============================================
-- VERIFY SETUP
-- ============================================
SELECT 'Setup complete!' AS message;
SELECT COUNT(*) AS product_count FROM products;
SELECT COUNT(*) AS user_count    FROM users;
