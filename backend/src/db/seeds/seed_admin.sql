-- Seed: default admin user
-- Password: Admin@123 (bcryptjs, 12 salt rounds)
-- Idempotent via ON CONFLICT.

INSERT INTO users (full_name, email, role, student_id, password_hash)
VALUES (
    'Admin User',
    'admin@joineazy.com',
    'admin',
    NULL,
    '$2a$12$7Lgp70j2My/VgPiTH3vfIebCRZZOnZ7DEN9riIiO9cjUFilql1HtG'
)
ON CONFLICT (email) DO NOTHING;
