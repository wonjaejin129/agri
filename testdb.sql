CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS shipment_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_date DATE,
  shipper_name VARCHAR(50),
  product_name VARCHAR(50),
  species VARCHAR(50),
  unit_weight VARCHAR(20),
  quantity INT,
  total_boxes INT
);

USE testdb; SHOW TABLES; DESC users;


