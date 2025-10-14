-- Add extended salon schema (customers, staff, appointments) with MySQL-compatible types

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL UNIQUE,
  phone VARCHAR(32) NULL,
  marketing_opt_in TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL UNIQUE,
  phone VARCHAR(32) NULL,
  role ENUM('admin','receptionist','stylist','technician') NOT NULL DEFAULT 'stylist',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  allow_overbooking TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Service categories and services already exist; ensure columns if needed
-- (no destructive changes here)

-- Staff qualifications
CREATE TABLE IF NOT EXISTS staff_service_skills (
  staff_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (staff_id, service_id),
  CONSTRAINT fk_sss_staff FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sss_service FOREIGN KEY (service_id) REFERENCES services(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  created_by_staff_id BIGINT UNSIGNED NULL,
  scheduled_start DATETIME NOT NULL,
  scheduled_end DATETIME NULL,
  status ENUM('scheduled','checked_in','in_service','completed','no_show','canceled') NOT NULL DEFAULT 'scheduled',
  notes TEXT NULL,
  selected_servicesIds JSON NULL,
  selected_staffIds JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_appt_creator FOREIGN KEY (created_by_staff_id) REFERENCES staff(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Appointment actual-taken services
CREATE TABLE IF NOT EXISTS appointment_actualtaken_services (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  appointment_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  doneby_staff_id BIGINT UNSIGNED NULL,
  status ENUM('scheduled','in_service','completed','canceled') NOT NULL DEFAULT 'scheduled',
  price DECIMAL(10,2) NULL,
  notes TEXT NULL,
  created_by_staff_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_as_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_as_service FOREIGN KEY (service_id) REFERENCES services(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_as_staff FOREIGN KEY (doneby_staff_id) REFERENCES staff(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
