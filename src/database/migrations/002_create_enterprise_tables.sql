-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    endpoint_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_template JSON,
    headers JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_endpoint_id (endpoint_id),
    INDEX idx_event_type (event_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    webhook_id INT NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    status_code INT NULL,
    success BOOLEAN DEFAULT FALSE,
    response_body TEXT NULL,
    error_message TEXT NULL,
    attempt_number INT DEFAULT 1,
    delivered_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webhook_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_event_id (event_id),
    INDEX idx_success (success),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create webhook_endpoints table
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT NULL,
    secret VARCHAR(255) NULL,
    events JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    retry_count INT DEFAULT 3,
    timeout_seconds INT DEFAULT 30,
    headers JSON NULL,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_url (url(255)),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create tenants table for multi-tenancy
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    database_schema VARCHAR(100) NULL,
    domain VARCHAR(255) NULL,
    settings JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_domain (domain),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ip_blocklist table
CREATE TABLE IF NOT EXISTS ip_blocklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason VARCHAR(255) NULL,
    blocked_by INT NULL,
    expires_at DATETIME NULL,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_ip_address (ip_address),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_permanent (is_permanent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_totp_secrets table
CREATE TABLE IF NOT EXISTS user_totp_secrets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    backup_codes JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    permissions JSON NULL,
    expires_at DATETIME NULL,
    last_used_at DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_key_hash (key_hash),
    INDEX idx_key_prefix (key_prefix),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INT DEFAULT 0,
    conditions JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default feature flags
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
('two_factor_auth', 'Enable Two-Factor Authentication', FALSE, 0),
('audit_export', 'Enable Audit Log Export', TRUE, 100),
('bulk_operations', 'Enable Bulk Import/Export', TRUE, 100),
('webhooks', 'Enable Webhook System', FALSE, 0),
('multi_tenancy', 'Enable Multi-Tenancy', FALSE, 0);
