-- Seed Data for Salon Management System
-- service_categories and Services based on provided data

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM services;
-- DELETE FROM service_categories;

-- Insert service_categories
INSERT INTO service_categories (name, description) VALUES
('Hair', 'Hair care and styling services'),
('Color', 'Hair coloring and highlighting services'),
('Beauty', 'Beauty and facial services'),
('Makeup', 'Makeup and styling services'),
('Nails', 'Nail care services including manicure, pedicure'),
('Packages', 'Special packages and combos');

-- Insert Services
-- Hair Services
INSERT INTO services (category_id, name, description, price, duration_min, gender, gst_percentage) VALUES
-- Cut & Grooming
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Hair Cut', 'Cut & Grooming', 220, 30, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Hair Cut (Senior Stylist)', 'Cut & Grooming', 500, 40, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Beard Trim', 'Cut & Grooming', 150, 15, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Clean Shave', 'Cut & Grooming', 150, 20, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Hair Wash', 'Wash & Styling', 100, 15, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'L''Oreal Spa', 'Spa', 800, 45, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'L''Oreal Majirel (15ml)', 'Root / Global', 1000, 60, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Ammonia Free (15ml)', 'Root / Global', 1000, 60, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Beard Color', 'Beard', 300, 20, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Beard Color (Ammonia Free)', 'Beard', 500, 25, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Hair Cut / Wash / Styling', 'Cut & Grooming', 800, 45, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Hair Cut / Wash / Styling (Senior Stylist)', 'Cut & Grooming', 1000, 60, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Hair Wash (Blast Dry)', 'Wash & Styling', 300, 30, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Wash & Styling', 'Wash & Styling', 600, 45, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Wash & Styling (Tongs)', 'Wash & Styling', 800, 60, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Wash & Styling (Ironing)', 'Wash & Styling', 800, 60, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'L''Oreal Spa', 'Spa', 1400, 90, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'L''Oreal Spa with Concentrate', 'Spa', 1700, 105, 'Female', 5),

-- Kids Services
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Creative Cut (Baby)', 'Kids', 500, 30, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Hair'), 'Creative Cut (Below 10)', 'Kids', 300, 25, 'Unisex', 5);

-- Color Services
INSERT INTO services (category_id, name, description, price, duration_min, gender, gst_percentage) VALUES
((SELECT id FROM service_categories WHERE name = 'Color'), 'Root Touchup (20ml)', 'Root / Global', 1000, 60, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Color'), 'INOA Ammonia Free (20ml)', 'Root / Global', 1200, 75, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Color'), 'Global Colour', 'Advanced', 3500, 120, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Color'), 'INOA Global Colour', 'Advanced', 4000, 150, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Color'), 'Balayage', 'Highlights', 4500, 180, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Color'), 'Highlights', 'Highlights', 5000, 180, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Color'), 'Fashion Colour (Per Streak)', 'Highlights', 650, 30, 'Unisex', 5);

-- Beauty Services
INSERT INTO services (category_id, name, description, price, duration_min, gender, gst_percentage) VALUES
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Cleanup', 'Facial', 800, 45, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Fruit Facial', 'Facial', 1000, 60, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Pearl & Gold Facial', 'Facial', 1500, 75, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Anti Ageing Facial', 'Facial', 2500, 90, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'O3+ Cleanup', 'Facial', 1500, 75, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Bridal Facial', 'Facial', 0, 90, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Hydra Facial (Normal)', 'Facial', 3000, 90, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Hydra Facial (O3+)', 'Facial', 4000, 120, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Eyebrow', 'Threading', 50, 10, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Upper Lips', 'Threading', 30, 5, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Full Face', 'Threading', 250, 25, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Full Arms (Rica)', 'Waxing', 550, 30, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Full Legs (Rica)', 'Waxing', 800, 45, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Full Body (Rica)', 'Waxing', 2000, 90, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Bikini Line', 'Waxing', 2500, 30, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Beauty'), 'Basic Makeup', 'Regular', 2000, 60, 'Female', 5);

-- Makeup Services
INSERT INTO services (category_id, name, description, price, duration_min, gender, gst_percentage) VALUES
((SELECT id FROM service_categories WHERE name = 'Makeup'), 'Hair Style', 'Regular', 1000, 45, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Makeup'), 'Saree Draping', 'Bridal', 1000, 30, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Makeup'), 'Basic + Saree Drape + Hair Style', 'Bridal', 6000, 150, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Makeup'), 'Bridal Makeup', 'Bridal', 15000, 180, 'Female', 5);

-- Nails Services
INSERT INTO services (category_id, name, description, price, duration_min, gender, gst_percentage) VALUES
((SELECT id FROM service_categories WHERE name = 'Nails'), 'Standard Manicure', 'Manicure', 500, 30, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Nails'), 'Standard Pedicure', 'Pedicure', 800, 45, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Nails'), 'Standard Manicure', 'Manicure', 500, 30, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Nails'), 'Spa Pedicure', 'Pedicure', 1000, 60, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Nails'), 'Spa Manicure', 'Manicure', 800, 45, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Nails'), 'Cut & Filing', 'Addon', 300, 15, 'Unisex', 5),
((SELECT id FROM service_categories WHERE name = 'Nails'), 'Nail Polish (Hands & Legs)', 'Addon', 200, 20, 'Unisex', 5);

-- Package Services
INSERT INTO services (category_id, name, description, price, duration_min, gender, gst_percentage) VALUES
((SELECT id FROM service_categories WHERE name = 'Packages'), 'Bridal Glow Package', 'Bridal Glow Package', 16200, 240, 'Female', 5),
((SELECT id FROM service_categories WHERE name = 'Packages'), 'Men Grooming Package', 'Men Grooming Package', 494, 60, 'Male', 5),
((SELECT id FROM service_categories WHERE name = 'Packages'), 'Party Ready Package', 'Party Ready Package', 2700, 120, 'Female', 5);

-- Verification query to check inserted data
SELECT 
    c.name as category,
    s.name as service,
    s.description as sub_category,
    s.price,
    s.gst_percentage,
    s.duration_min,
    s.gender
FROM services s
JOIN service_categories c ON s.category_id = c.id
ORDER BY c.name, s.name;
