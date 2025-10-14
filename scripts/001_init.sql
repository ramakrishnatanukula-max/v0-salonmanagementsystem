-- Users: mobile as primary key
CREATE TABLE IF NOT EXISTS users (
  mobile VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL,
  role ENUM('admin','receptionist','staff') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  duration_min INT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- Staff can perform which services (many-to-many)
CREATE TABLE IF NOT EXISTS staff_services (
  mobile VARCHAR(20) NOT NULL,
  service_id INT NOT NULL,
  PRIMARY KEY (mobile, service_id),
  FOREIGN KEY (mobile) REFERENCES users(mobile),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Minimal seed so staff can choose services during signup
INSERT INTO service_categories (name)
SELECT * FROM (SELECT 'Hair') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name='Hair');

INSERT INTO service_categories (name)
SELECT * FROM (SELECT 'Spa') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name='Spa');

-- Seed services if table is empty
INSERT INTO services (category_id, name, duration_min, price)
SELECT c.id, 'Haircut', 45, 20.00 FROM service_categories c WHERE c.name='Hair'
AND NOT EXISTS (SELECT 1 FROM services s JOIN service_categories sc ON s.category_id=sc.id WHERE s.name='Haircut' AND sc.name='Hair');

INSERT INTO services (category_id, name, duration_min, price)
SELECT c.id, 'Coloring', 90, 60.00 FROM service_categories c WHERE c.name='Hair'
AND NOT EXISTS (SELECT 1 FROM services s JOIN service_categories sc ON s.category_id=sc.id WHERE s.name='Coloring' AND sc.name='Hair');

INSERT INTO services (category_id, name, duration_min, price)
SELECT c.id, 'Facial', 60, 40.00 FROM service_categories c WHERE c.name='Spa'
AND NOT EXISTS (SELECT 1 FROM services s JOIN service_categories sc ON s.category_id=sc.id WHERE s.name='Facial' AND sc.name='Spa');
