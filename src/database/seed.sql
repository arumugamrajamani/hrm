USE hrm_db;

-- Insert sample users
-- Password for all users: password (lowercase)
-- Hash generated with bcrypt, 10 rounds
INSERT INTO users (username, email, mobile, password, role_id, status, password_changed_at) VALUES
('superadmin', 'superadmin@hrm.com', '+1234567890', '$2b$10$z6pE63vbA9.5ESMrATTFguddvWwYkGXb0G59AwoW7NKSmknIzb7bK', 1, 'active', NOW()),
('admin', 'admin@hrm.com', '+1234567891', '$2b$10$z6pE63vbA9.5ESMrATTFguddvWwYkGXb0G59AwoW7NKSmknIzb7bK', 2, 'active', NOW()),
('manager', 'manager@hrm.com', '+1234567892', '$2b$10$z6pE63vbA9.5ESMrATTFguddvWwYkGXb0G59AwoW7NKSmknIzb7bK', 3, 'active', NOW()),
('employee', 'employee@hrm.com', '+1234567893', '$2b$10$z6pE63vbA9.5ESMrATTFguddvWwYkGXb0G59AwoW7NKSmknIzb7bK', 4, 'active', NOW());
