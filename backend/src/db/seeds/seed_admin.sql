-- Seed: default admin user
-- Password: test@123 (bcryptjs, 12 salt rounds)
-- Idempotent via ON CONFLICT.

INSERT INTO users (full_name, email, role, student_id, password_hash)
VALUES (
    'Admin User',
    'admin@groupd.com',
    'admin',
    NULL,
    '$2a$12$Wgds35FrXDtJEBMX4oHIBup/HQ/k8gESEa3WY1LAFbHo0MeCtCh7a'
)
ON CONFLICT (email) DO NOTHING;
