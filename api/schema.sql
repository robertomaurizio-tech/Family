
-- Creazione Database
CREATE DATABASE IF NOT EXISTS familycash_db;
USE familycash_db;

-- Tabella Categorie
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL
);

-- Tabella Spese
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    categoryId VARCHAR(36),
    description TEXT,
    date DATE NOT NULL,
    isExtra BOOLEAN DEFAULT FALSE,
    vacationName VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabella Lista Spesa
CREATE TABLE IF NOT EXISTS shopping_list (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0
);

-- Tabella Frequenza Shopping
CREATE TABLE IF NOT EXISTS shopping_frequency (
    name VARCHAR(255) PRIMARY KEY,
    count INT DEFAULT 1
);

-- Tabella Spese Sandro
CREATE TABLE IF NOT EXISTS sandro_expenses (
    id VARCHAR(36) PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE
);

-- Tabella Liquidazioni Sandro
CREATE TABLE IF NOT EXISTS sandro_settlements (
    id VARCHAR(36) PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    date DATETIME NOT NULL
);

-- Tabella Veicoli
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plate VARCHAR(20),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INT,
    notes TEXT
);

-- Tabella Manutenzione Veicoli
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id VARCHAR(36) PRIMARY KEY,
    vehicleId VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'maintenance', 'repair', 'tax', 'insurance', 'other'
    date DATE NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    description TEXT,
    km INT,
    next_due_date DATE,
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Inserimento Categoria Default
INSERT IGNORE INTO categories (id, name, color) VALUES ('7', 'Altro', '#64748b');
