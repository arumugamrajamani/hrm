USE hrm_db;

-- Insert sample users
-- Password for all users: password (lowercase)
-- Hash generated with bcrypt, 10 rounds
INSERT INTO users (username, email, mobile, password, role_id, status, password_changed_at) VALUES
('superadmin', 'superadmin@hrm.com', '+1234567890', '$2b$10$z6pE63vbA9.5ESMrATTFguddvWwYkGXb0G59AwoW7NKSmknIzb7bK', 1, 'active', NOW()),
('admin', 'admin@hrm.com', '+1234567891', '$2b$10$z6pE63vbA9.5ESMrATTFguddvWwYkGXb0G59AwoW7NKSmknIzb7bK', 2, 'active', NOW()),
('manager', 'manager@hrm.com', '+1234567892', '$2b$10$z6pE63vbA9.5ESMrATTFguddvWwYkGXb0G59AwoW7NKSmknIzb7bK', 3, 'active', NOW()),
('employee', 'employee@hrm.com', '+1234567893', '$2b$10$z6pE63vbA9.5ESMrATTFguddvWwYkGXb0G59AwoW7NKSmknIzb7bK', 4, 'active', NOW());

-- Insert Education Master (Seed Data)
INSERT INTO education_master (education_name, education_code, level, description, status, created_by) VALUES
('Bachelor of Engineering', 'BE', 'UG', 'Undergraduate engineering degree program', 'active', 1),
('Bachelor of Technology', 'BTECH', 'UG', 'Undergraduate technology degree program', 'active', 1),
('Bachelor of Science', 'BSC', 'UG', 'Undergraduate science degree program', 'active', 1),
('Master of Business Administration', 'MBA', 'PG', 'Postgraduate management degree program', 'active', 1),
('Master of Technology', 'MTECH', 'PG', 'Postgraduate technology degree program', 'active', 1);

-- Insert Course Master (Seed Data)
INSERT INTO course_master (course_name, course_code, description, status, created_by) VALUES
('Computer Science', 'CSE', 'Computer Science and Engineering', 'active', 1),
('Electronics', 'ECE', 'Electronics and Communication Engineering', 'active', 1),
('Mechanical', 'MECH', 'Mechanical Engineering', 'active', 1),
('Finance', 'FIN', 'Finance and Accounting', 'active', 1),
('Marketing', 'MKT', 'Marketing and Sales', 'active', 1);

-- Insert Education-Course Mappings (Seed Data)
INSERT INTO education_course_map (education_id, course_id, created_by) VALUES
(1, 1, 1),  -- BE -> CSE
(1, 2, 1),  -- BE -> ECE
(1, 3, 1),  -- BE -> Mechanical
(2, 1, 1),  -- B.Tech -> CSE
(2, 2, 1),  -- B.Tech -> ECE
(2, 3, 1),  -- B.Tech -> Mechanical
(3, 1, 1),  -- B.Sc -> CSE
(4, 4, 1),  -- MBA -> Finance
(4, 5, 1),  -- MBA -> Marketing
(5, 1, 1),  -- M.Tech -> CSE
(5, 3, 1);  -- M.Tech -> Mechanical
