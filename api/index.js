
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Db-Host', 'X-Db-User', 'X-Db-Pass', 'X-Db-Name', 'X-Db-Port'],
  credentials: true
}));

app.use(express.json());

const DOCKER_DB_CONFIG = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'drago',
  password: process.env.DB_PASS || 'drago_password',
  database: process.env.DB_NAME || 'familycash_db',
  port: parseInt(process.env.DB_PORT || '3306'),
};

const getDbConfig = (req) => {
  const headerHost = req.headers['x-db-host'];
  if (headerHost && headerHost !== 'localhost' && headerHost !== 'db') {
      return {
        host: headerHost,
        user: req.headers['x-db-user'],
        password: req.headers['x-db-pass'],
        database: req.headers['x-db-name'],
        port: parseInt(req.headers['x-db-port'] || '3306'),
      };
  }
  return DOCKER_DB_CONFIG;
};

const initializeDb = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color VARCHAR(7) NOT NULL
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(36) PRIMARY KEY,
      amount DECIMAL(10,2) NOT NULL,
      categoryId VARCHAR(36),
      description TEXT,
      date DATE NOT NULL,
      isExtra BOOLEAN DEFAULT FALSE,
      vacationName VARCHAR(255) DEFAULT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // Migrazione silente se la colonna non esiste
  try {
    await connection.query('ALTER TABLE expenses ADD COLUMN vacationName VARCHAR(255) DEFAULT NULL');
  } catch (e) { /* Colonna già esistente */ }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS shopping_list (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      checked BOOLEAN DEFAULT FALSE,
      order_index INT DEFAULT 0
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS shopping_frequency (
      name VARCHAR(255) PRIMARY KEY,
      count INT DEFAULT 1
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sandro_expenses (
      id VARCHAR(36) PRIMARY KEY,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      is_settled BOOLEAN DEFAULT FALSE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sandro_settlements (
      id VARCHAR(36) PRIMARY KEY,
      amount DECIMAL(10,2) NOT NULL,
      date DATETIME NOT NULL
    )
  `);

  const [rows] = await connection.query('SELECT id FROM categories WHERE id = "7"');
  if (rows.length === 0) {
    await connection.query('INSERT IGNORE INTO categories (id, name, color) VALUES ("7", "Altro", "#64748b")');
  }
};

app.get('/api/test-connection', async (req, res) => {
  let connection;
  try {
    const config = getDbConfig(req);
    connection = await mysql.createConnection(config);
    await initializeDb(connection);
    res.json({ success: true, message: `Connessione riuscita a MySQL (${config.host})` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// --- EXPENSES ---
app.get('/api/expenses', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(rows.map(r => ({ ...r, isExtra: !!r.isExtra, date: new Date(r.date).toISOString().split('T')[0] })));
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.post('/api/expenses', async (req, res) => {
  let connection;
  try {
    const { id, amount, categoryId, description, date, isExtra, vacationName } = req.body;
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query(
      'INSERT INTO expenses (id, amount, categoryId, description, date, isExtra, vacationName) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = ?, categoryId = ?, description = ?, date = ?, isExtra = ?, vacationName = ?',
      [id, amount, categoryId, description, date, isExtra, vacationName, amount, categoryId, description, date, isExtra, vacationName]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.delete('/api/expenses/:id', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

// --- VACATIONS ---
app.get('/api/vacations', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT DISTINCT vacationName as name FROM expenses WHERE vacationName IS NOT NULL AND vacationName != ""');
    res.json(rows.map((r, i) => ({ id: String(i), name: r.name })));
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.post('/api/vacations/get-or-create', async (req, res) => {
  const { name } = req.body;
  res.json({ id: Math.random().toString(36).substring(2, 11), name });
});

// --- SANDRO ACCOUNT ---
app.get('/api/sandro-expenses', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT id, amount, description, date, is_settled as isSettled FROM sandro_expenses WHERE is_settled = FALSE ORDER BY date DESC');
    res.json(rows.map(r => ({ ...r, isSettled: !!r.isSettled, date: new Date(r.date).toISOString().split('T')[0] })));
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.get('/api/sandro-settlements', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT * FROM sandro_settlements ORDER BY date DESC LIMIT 5');
    res.json(rows.map(r => ({ ...r, date: new Date(r.date).toISOString() })));
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.post('/api/sandro-expenses/settle', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT SUM(amount) as total FROM sandro_expenses WHERE is_settled = FALSE');
    const total = rows[0].total || 0;
    if (total > 0) {
      const settlementId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await connection.query('INSERT INTO sandro_settlements (id, amount, date) VALUES (?, ?, NOW())', [settlementId, total]);
      await connection.query('UPDATE sandro_expenses SET is_settled = TRUE WHERE is_settled = FALSE');
    }
    res.json({ success: true, amount: total });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.post('/api/sandro-expenses', async (req, res) => {
  let connection;
  try {
    const { id, amount, description, date } = req.body;
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query(
      'INSERT INTO sandro_expenses (id, amount, description, date) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = ?, description = ?, date = ?',
      [id, amount, description, date, amount, description, date]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.delete('/api/sandro-expenses/:id', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query('DELETE FROM sandro_expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.get('/api/shopping-list', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT id, name, checked, order_index as orderIndex FROM shopping_list ORDER BY order_index ASC');
    res.json(rows.map(r => ({ ...r, checked: !!r.checked })));
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.post('/api/shopping-list', async (req, res) => {
  let connection;
  try {
    const { id, name, checked, orderIndex } = req.body;
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query(
      'INSERT INTO shopping_list (id, name, checked, order_index) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, checked = ?, order_index = ?',
      [id, name, checked, orderIndex, name, checked, orderIndex]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.delete('/api/shopping-list/:id', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query('DELETE FROM shopping_list WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.get('/api/shopping-list/frequency', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT name, count FROM shopping_frequency ORDER BY count DESC LIMIT 20');
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.post('/api/shopping-list/frequency', async (req, res) => {
  let connection;
  try {
    const { name } = req.body;
    const cleanName = name.trim().toLowerCase();
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query('INSERT INTO shopping_frequency (name, count) VALUES (?, 1) ON DUPLICATE KEY UPDATE count = count + 1', [cleanName]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.get('/api/categories', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.post('/api/categories', async (req, res) => {
  let connection;
  try {
    const { id, name, color } = req.body;
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query('INSERT INTO categories (id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, color = ?', [id, name, color, name, color]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.delete('/api/categories/:id', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(getDbConfig(req));
    await connection.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

app.post('/api/categories/get-or-create', async (req, res) => {
  let connection;
  try {
    const { name } = req.body;
    connection = await mysql.createConnection(getDbConfig(req));
    const [rows] = await connection.query('SELECT * FROM categories WHERE name = ?', [name]);
    if (rows.length > 0) return res.json(rows[0]);
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const color = '#6366f1';
    await connection.query('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)', [id, name, color]);
    res.json({ id, name, color });
  } catch (error) { res.status(500).json({ error: error.message }); }
  finally { if (connection) await connection.end(); }
});

const PORT = 3001; 
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend FinanceHub attivo su porta ${PORT}`);
});
