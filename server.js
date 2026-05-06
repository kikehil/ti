const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Configuración de la conexión a PostgreSQL.
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'portal_db',
  password: 'Netbios85*',
  port: 5432,
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Sirve archivos estáticos (HTML, JS, CSS, assets)

// Ruta para la API de login
app.post('/api/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND contrasena = $2',
      [correo, contrasena]
    );

    if (result.rows.length > 0) {
      // Login exitoso
      res.json({ success: true, message: 'Login exitoso', usuario: result.rows[0] });
    } else {
      // Credenciales incorrectas
      res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }
  } catch (err) {
    console.error('Error en el login:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// API para guardar reporte de movilidad
app.post('/api/movilidad/guardar', async (req, res) => {
  const { mes, plaza, usuario, general, garantias, depreciados, stock, conectividad } = req.body;
  try {
    const query = `
      INSERT INTO movilidad_reportes (mes, plaza, usuario, datos_general, datos_garantias, datos_depreciados, datos_stock, datos_conectividad)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (mes, plaza) 
      DO UPDATE SET 
        usuario = EXCLUDED.usuario,
        datos_general = EXCLUDED.datos_general,
        datos_garantias = EXCLUDED.datos_garantias,
        datos_depreciados = EXCLUDED.datos_depreciados,
        datos_stock = EXCLUDED.datos_stock,
        datos_conectividad = EXCLUDED.datos_conectividad,
        fecha_creacion = CURRENT_TIMESTAMP;
    `;
    await pool.query(query, [mes, plaza, usuario, general, garantias, depreciados, stock, conectividad]);
    res.json({ success: true, message: 'Reporte guardado exitosamente' });
  } catch (err) {
    console.error('Error al guardar reporte:', err);
    res.status(500).json({ success: false, message: 'Error al guardar el reporte' });
  }
});

// API para obtener reporte de movilidad por mes y plaza
app.get('/api/movilidad/reporte/:mes/:plaza', async (req, res) => {
  const { mes, plaza } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM movilidad_reportes WHERE mes = $1 AND plaza = $2',
      [mes, plaza]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, reporte: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'No se encontró reporte para este mes y plaza' });
    }
  } catch (err) {
    console.error('Error al obtener reporte:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// API para guardar reporte de FCE
app.post('/api/fce/guardar', async (req, res) => {
  const { mes, plaza, usuario, scores, promedio } = req.body;
  try {
    const query = `
      INSERT INTO fce_reportes (mes, plaza, usuario, scores, promedio)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (mes, plaza) 
      DO UPDATE SET 
        usuario = EXCLUDED.usuario,
        scores = EXCLUDED.scores,
        promedio = EXCLUDED.promedio,
        fecha_creacion = CURRENT_TIMESTAMP;
    `;
    await pool.query(query, [mes, plaza, usuario, scores, promedio]);
    res.json({ success: true, message: 'Reporte FCE guardado exitosamente' });
  } catch (err) {
    console.error('Error al guardar reporte FCE:', err);
    res.status(500).json({ success: false, message: 'Error al guardar el reporte FCE' });
  }
});

// API para obtener histórico de FCE por plaza (para tendencia)
app.get('/api/fce/historico/:plaza', async (req, res) => {
  const { plaza } = req.params;
  try {
    const result = await pool.query(
      'SELECT mes, promedio, scores FROM fce_reportes WHERE plaza = $1 ORDER BY mes ASC',
      [plaza]
    );
    res.json({ success: true, historico: result.rows });
  } catch (err) {
    console.error('Error al obtener histórico FCE:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// API para obtener reporte FCE por mes y plaza
app.get('/api/fce/reporte/:mes/:plaza', async (req, res) => {
  const { mes, plaza } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM fce_reportes WHERE mes = $1 AND plaza = $2',
      [mes, plaza]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, reporte: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'No se encontró reporte' });
    }
  } catch (err) {
    console.error('Error al obtener reporte FCE:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Rutas por defecto que redirigen a login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'portal.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log('Por favor asegúrate de haber ejecutado: node dbSetup.js');
});
