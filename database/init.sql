CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees (name, email)
VALUES
    ('Yuvaraj', 'yuvaraj@example.com'),
    ('DevOps User', 'devops@example.com')
ON CONFLICT (email) DO NOTHING;
