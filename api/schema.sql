
-- Creazione Database
CREATE DATABASE IF NOT EXISTS family_finance;
USE family_finance;

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

-- Inserimento Categoria Default
INSERT IGNORE INTO categories (id, name, color) VALUES ('7', 'Altro', '#64748b');
