const { Client } = require('pg');
const fs = require('fs');

// Configuración de la conexión a PostgreSQL.
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Netbios85*',
  port: 5432,
});

async function setup() {
  try {
    await client.connect();

    // Crear la base de datos "portal_db" si no existe
    const resDb = await client.query("SELECT datname FROM pg_catalog.pg_database WHERE datname = 'portal_db'");
    if (resDb.rowCount === 0) {
      console.log('Creando base de datos portal_db...');
      await client.query('CREATE DATABASE portal_db');
      console.log('Base de datos creada exitosamente.');
    } else {
      console.log('La base de datos portal_db ya existe.');
    }

  } catch (err) {
    console.error('Error al conectarse o crear la base de datos:', err);
  } finally {
    await client.end();
  }

  // Ahora nos conectamos a la nueva base de datos "portal_db"
  const dbClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'portal_db',
    password: 'Netbios85*',
    port: 5432,
  });

  try {
    await dbClient.connect();

    // Crear la tabla usuarios
    console.log('Creando tabla usuarios...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(255) NOT NULL,
        correo VARCHAR(255) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        plaza VARCHAR(255) NOT NULL,
        rol VARCHAR(255) DEFAULT 'Asesor TI'
      );
    `);
    
    // Add 'rol' column if it doesn't exist (for existing tables)
    try {
      await dbClient.query(`ALTER TABLE usuarios ADD COLUMN rol VARCHAR(255) DEFAULT 'Asesor TI';`);
    } catch (e) {
      // Column already exists, ignore error
    }
    
    console.log('Tabla usuarios creada (o ya existía).');

    // Crear la tabla movilidad_reportes
    console.log('Creando tabla movilidad_reportes...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS movilidad_reportes (
        id SERIAL PRIMARY KEY,
        mes VARCHAR(7) NOT NULL, -- Formato YYYY-MM
        plaza VARCHAR(255) NOT NULL,
        usuario VARCHAR(255) NOT NULL,
        datos_general JSONB NOT NULL,
        datos_garantias JSONB NOT NULL,
        datos_depreciados JSONB NOT NULL,
        datos_stock JSONB NOT NULL,
        datos_conectividad JSONB NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mes, plaza) -- Evitar duplicados por mes y plaza
      );
    `);
    console.log('Tabla movilidad_reportes creada (o ya existía).');
    
    // Crear la tabla fce_reportes
    console.log('Creando tabla fce_reportes...');
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS fce_reportes (
        id SERIAL PRIMARY KEY,
        mes VARCHAR(7) NOT NULL, -- Formato YYYY-MM
        plaza VARCHAR(255) NOT NULL,
        usuario VARCHAR(255) NOT NULL,
        scores JSONB NOT NULL,
        promedio NUMERIC(5,2) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mes, plaza)
      );
    `);
    console.log('Tabla fce_reportes creada (o ya existía).');

    // Leer el archivo usuarios.json
    const usuariosData = JSON.parse(fs.readFileSync('./usuarios.json', 'utf-8'));

    console.log('Insertando usuarios en la base de datos...');
    for (const user of usuariosData) {
      // Usar UPSERT (ON CONFLICT) para evitar duplicados si se ejecuta varias veces
      await dbClient.query(`
        INSERT INTO usuarios (usuario, correo, contrasena, plaza, rol)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (correo) DO UPDATE SET usuario = EXCLUDED.usuario, plaza = EXCLUDED.plaza, rol = EXCLUDED.rol
      `, [user.usuario, user.correo, user.contrasena, user.plaza, user.rol || 'Asesor TI']);
    }
    console.log('Usuarios insertados correctamente.');

  } catch (err) {
    console.error('Error configurando la tabla o insertando datos:', err);
  } finally {
    await dbClient.end();
  }
}

setup();
