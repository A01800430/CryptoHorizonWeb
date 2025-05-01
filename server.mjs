import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config(); // Carga el archivo .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = process.env.BASE_URL || `http://${ipAddress}:${port}`; //generar link de recuperación

const app = express();
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: "clave-super-secreta",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 horas
}));

// Middleware para verificar la autenticación
function checkAuth(req, res, next) {
  if (!req.session.authenticated) {
    // Destruye la sesión por completo por seguridad
    req.session.destroy();
    return res.redirect('/login');
  }
  next();
}

app.use('/dashboard', checkAuth);
app.use('/profile', checkAuth);
app.use('/patterns', checkAuth);
app.use('/world', checkAuth);

//Unity game
app.use('/Build', express.static(path.join(__dirname, 'views/Game/Build')));
app.use('/TemplateData', express.static(path.join(__dirname, 'views/Game/TemplateData')));

const port = process.env.PORT ?? 8080;
const ipAddress = process.env.C9_HOSTNAME ?? 'localhost';

// ==================== Conexión a MySQL ====================
async function getDBConnection() {
  return await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      waitForConnections: true
  });
}

// ==================== Directorio raiz (root) ==================
app.get("/", (req, res) => {res.render("publicViews//home");});

// ==================== Juego Unity =================

app.get('/game', (req, res) => {
    res.render('Game/game');
});

// ==================== Login (Unity API) ====================
app.post("/loginUser", async (req, res) => {
    const { username, pass } = req.body;

    if (!username || !pass) {
        console.warn("⚠️ Faltan campos para login:", req.body);
        return res.json({ done: false, message: "Faltan datos" });
    }

    let connection;
    try {
        const passHash = crypto.createHash("sha256").update(pass).digest("hex");
        connection = await getDBConnection();

        const [result] = await connection.execute(
            "SELECT id_usuario, userName, password FROM Usuario WHERE userName = ?",
            [username]
        );

        if (result.length === 0 || result[0].password !== passHash) {
            return res.json({ done: false, message: "Credenciales incorrectas" });
        }

        const user = result[0];
        console.log("✅ Login correcto:", username);
        return res.json({ done: true, message: "Login exitoso. Bienvenido!", userId: user.id_usuario });

    } catch (err) {
        console.error("❌ Error al buscar usuario:", err);
        return res.json({ done: false, message: "Error en el servidor" });
    } finally {
        if (connection) await connection.end();
    }
});

// ==================== Registro de usuario ====================
app.post("/createUser", async (req, res) => {
    const {
        username, email, pass, birthDate, gender,
        country, deviceModel, operatingSystem, platform, systemLanguage
    } = req.body;

    if (!username || !email || !pass) {
        return res.json({ done: false, message: "Faltan campos" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.json({ done: false, message: "Correo no válido" });
    }

    const passHash = crypto.createHash("sha256").update(pass).digest("hex");

    let connection;
    try {
        connection = await getDBConnection();

        const [userCheck] = await connection.execute(
            "SELECT * FROM Usuario WHERE userName = ?",
            [username]
        );
        if (userCheck.length > 0) {
            return res.json({ done: false, message: "El usuario ya existe" });
        }

        const [emailCheck] = await connection.execute(
            "SELECT * FROM Usuario WHERE email = ?",
            [email]
        );
        if (emailCheck.length > 0) {
            return res.json({ done: false, message: "El correo ya está registrado" });
        }

        const insertSQL = `
            INSERT INTO Usuario
            (userName, email, password, birthDate, gender, country, deviceModel, operatingSystem, platform, systemLanguage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            username, email, passHash, birthDate || null, gender || null,
            country || null, deviceModel || null, operatingSystem || null,
            platform || null, systemLanguage || null
        ];

        await connection.execute(insertSQL, values);

        console.log("✅ Usuario registrado:", username);
        res.json({ done: true, message: "Usuario creado con éxito" });

    } catch (err) {
        console.error("❌ Error al registrar:", err);
        res.json({ done: false, message: "Error al registrar el usuario" });
    } finally {
        if (connection) await connection.end();
    }
});

// ==================== 👑 Registro de administrador ====================
app.post("/createAdmin", async (req, res) => {
  const {
      username, email, pass, birthDate, gender,
      country, master_pass, deviceModel, operatingSystem, platform, systemLanguage
  } = req.body;

  if (master_pass !== process.env.MASTER_PASS) {
      return res.json({ done: false, message: "Acceso no autorizado" });
  }

  if (!username || !email || !pass) {
      return res.json({ done: false, message: "Faltan campos" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
      return res.json({ done: false, message: "Correo no válido" });
  }

  const passHash = crypto.createHash("sha256").update(pass).digest("hex");

  let connection;
  try {
      connection = await getDBConnection();

      const [userCheck] = await connection.execute(
          "SELECT * FROM Usuario WHERE userName = ?",
          [username]
      );
      if (userCheck.length > 0) {
          return res.json({ done: false, message: "El usuario ya existe" });
      }

      const [emailCheck] = await connection.execute(
          "SELECT * FROM Usuario WHERE email = ?",
          [email]
      );
      if (emailCheck.length > 0) {
          return res.json({ done: false, message: "El correo ya está registrado" });
      }

      const insertSQL = `
          INSERT INTO Usuario
          (userName, email, password, birthDate, gender, country, deviceModel, operatingSystem, platform, systemLanguage, is_admin)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
          username, email, passHash, birthDate || null, gender || null,
          country || null, deviceModel || null, operatingSystem || null,
          platform || null, systemLanguage || null, true
      ];

      await connection.execute(insertSQL, values);

      console.log("👑 Administrador registrado:", username);
      res.json({ done: true, message: "Administrador creado con éxito" });

  } catch (err) {
      console.error("❌ Error al registrar administrador:", err);
      res.json({ done: false, message: "Error al registrar el administrador" });
  } finally {
      if (connection) await connection.end();
  }
});

app.get("/register", (req, res) => {
    res.render("auth/register", { error: null, success: null });
  });

app.post("/register", async (req, res) => {
    try {
      const response = await fetch(`http://${ipAddress}:${port}/createAdmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const result = await response.json();

      if (result.done) {
        return res.render("auth/register", {
          success: "✅ Administrador creado correctamente. Ya puedes iniciar sesión.",
          error: null
        });
      } else {
        return res.render("auth/register", {
          error: result.message || "Error al registrar",
          success: null
        });
      }
    } catch (err) {
      console.error("❌ Error en registro web:", err);
      return res.render("dashboard/register", {
        error: "Error del servidor",
        success: null
      });
    }
  });

// ==================== 📦 Guardar sesión ====================
app.post("/saveSession", async (req, res) => {
    const { id_usuario, startTime, endTime } = req.body;

    if (!id_usuario || !startTime || !endTime) {
        return res.json({ done: false, message: "Datos incompletos" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start) || isNaN(end)) {
        return res.json({ done: false, message: "Fechas inválidas" });
    }

    const duration = Math.floor((end - start) / 1000);

    let connection;
    try {
        connection = await getDBConnection();
        const sql = `
            INSERT INTO Sesion (id_usuario, startTime, endTime, duration_seconds)
            VALUES (?, ?, ?, ?)
        `;

        await connection.execute(sql, [id_usuario, startTime, endTime, duration]);

        console.log(`📦 Sesión guardada: ${id_usuario}, duración: ${duration}s`);
        res.json({ done: true, message: "Sesión registrada correctamente." });

    } catch (err) {
        console.error("❌ Error al guardar sesión:", err);
        res.json({ done: false, message: "Error al guardar la sesión" });
    } finally {
        if (connection) await connection.end();
    }
});

// ==================== ✅ Login para dashboard ====================

app.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let connection;
  try {
    connection = await getDBConnection();

    const [rows] = await connection.execute(
      `SELECT id_usuario, password, userName, is_admin FROM Usuario WHERE userName = ?`,
      [username]
    );

    if (rows.length === 0) {
      return res.render("auth/login", {
        error: "User not found"
      });
    }

    const user = rows[0];

    const inputPasswordHash = crypto.createHash("sha256").update(password).digest("hex");

    if (inputPasswordHash !== user.password) {
      return res.render("auth/login", {
        error: "Incorrect password"
      });
    }

    if (user.is_admin === 0) {
      return res.render("auth/login", {
        error: "Error: no admin privileges"
      });
    }

    req.session.authenticated = true;
    req.session.userId = user.id_usuario;
    req.session.username = user.userName;

    return res.redirect("/dashboard");

  } catch (err) {
    console.error("Login error:", err);
    return res.render("dashboard/login", {
      error: "Server error"
    });
  } finally {
    if (connection) await connection.end();
  }
});

// Inicializa una sola vez al inicio del archivo:
const resend = new Resend("re_6yec76eG_QK8TLJRoZBFWDmEBNAm9BLxD");

app.get("/forgot", (req, res) => {
  res.render("auth/forgot", { error: null, success: null });
});

app.post("/forgot", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.render("auth/forgot", {
      success: null,
      error: "📭 Email is required",
    });
  }

  let connection;
  try {
    connection = await getDBConnection();

    const [result] = await connection.execute(
      "SELECT * FROM Usuario WHERE email = ?",
      [email]
    );

    if (result.length === 0) {
      return res.render("auth/forgot", {
        success: null,
        error: "❌ This email is not registered.",
      });
    }

    const tokenData = {
      email,
      exp: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64url");
    const resetLink = `${BASE_URL}/reset-password?token=${token}`;

    const response = await resend.emails.send({
      from: "CryptoHorizon <no-reply@cryptohorizongame.org>",
      to: email,
      subject: "Reset your password",
      html: `
        <p>Click the link to reset your password</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    console.log("📬 Respuesta de Resend:", response);

    if (response.error) {
      return res.render("auth/forgot", {
        success: null,
        error: "❌ Failed to send email. Please try again later.",
      });
    }

    return res.render("auth/forgot", {
      success: "📧 Email sent! Check your inbox to reset your password.",
      error: null,
    });

  } catch (err) {
    console.error("❌ Error general en /forgot:", err);
    return res.render("auth/forgot", {
      success: null,
      error: "❌ Something went wrong. Please try again later.",
    });
  } finally {
    if (connection) await connection.end();
  }
});


// Para el formulario de reseteo de contraseña
app.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Token not provided.");
  }

  let payload;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    payload = JSON.parse(decoded);

    if (!payload.email || !payload.exp || Date.now() > payload.exp) {
      return res.status(400).send("Token expired or invalid.");
    }
  } catch (err) {
    return res.status(400).send("Token inválido.");
  }

  // Mostrar el formulario correctamente
  res.render("auth/reset-password", { token, error: null, success: null });
});

// Procesa la nueva contraseña y actualiza la BD
app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.render("auth/reset-password", {
      token,
      error: "All fields are required",
      success: null
    });
  }

  let payload;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    payload = JSON.parse(decoded);

    if (!payload.email || !payload.exp || Date.now() > payload.exp) {
      return res.render("dashboard/reset-password", {
        token: null,
        error: "The link has expired or is invalid",
        success: null
      });
    }
  } catch (err) {
    return res.render("auth/reset-password", {
      token: null,
      error: "invalid token",
      success: null
    });
  }

  const hashed = crypto.createHash("sha256").update(password).digest("hex");

  let connection;
  try {
    connection = await getDBConnection();
    await connection.execute(
      "UPDATE Usuario SET password = ? WHERE email = ?",
      [hashed, payload.email]
    );

    return res.render("dashboard/reset-password", {
      token: null,
      success: "✅ Contraseña actualizada correctamente. Ya puedes iniciar sesión.",
      error: null
    });

  } catch (err) {
    console.error("❌ Error al restablecer contraseña:", err);
    return res.render("dashboard/reset-password", {
      token,
      error: "Server error",
      success: null
    });
  } finally {
    if (connection) await connection.end();
  }
});



// ======================= 📊 Dashboard =======================
app.get("/dashboard", async (req, res) => {
  if (!req.session.authenticated) {
      return res.redirect("/login");
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const sql = {
      users: `
          SELECT u.userName, u.country, u.deviceModel, u.platform, s.startTime, s.endTime,
              TIMESTAMPDIFF(MINUTE, s.startTime, s.endTime) AS duration_min
          FROM Usuario u
          LEFT JOIN Sesion s ON u.id_usuario = s.id_usuario
          WHERE s.startTime IS NOT NULL
          ORDER BY s.startTime DESC
          LIMIT 15
      `,
      totalUsers: `SELECT COUNT(*) AS total FROM Usuario`,
      avgSession: `SELECT ROUND(AVG(duration_seconds)/60, 2) AS avg FROM Sesion`,
      countries: `SELECT COUNT(DISTINCT country) AS total FROM Usuario`,
      activeToday: `
          SELECT COUNT(*) AS total
          FROM Sesion
          WHERE DATE(startTime) = DATE(CONVERT_TZ(NOW(), '+00:00', '-06:00'));
      `,
      thisWeek: `
          SELECT COUNT(*) AS total
          FROM Sesion
          WHERE startTime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      topDevice: `
          SELECT deviceModel, COUNT(*) AS total
          FROM Usuario
          GROUP BY deviceModel
          ORDER BY total DESC
          LIMIT 1
      `,
      topLanguage: `
          SELECT systemLanguage, COUNT(*) AS total
          FROM Usuario
          GROUP BY systemLanguage
          ORDER BY total DESC
          LIMIT 1
      `,
      topPlatform: `
          SELECT platform, COUNT(*) AS total
          FROM Usuario
          GROUP BY platform
          ORDER BY total DESC
          LIMIT 1
      `,
      sessionsByDay: `
          SELECT DATE(startTime) as day, COUNT(*) AS count
          FROM Sesion
          WHERE startTime >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)
          GROUP BY day
          ORDER BY day ASC
      `,
      countriesPie: `
          SELECT country, COUNT(*) AS total
          FROM Usuario
          GROUP BY country
          ORDER BY total DESC
          LIMIT 10
      `,
      durationHistogram: `
          SELECT FLOOR(duration_seconds / 60) AS duration_min, COUNT(*) AS count
          FROM Sesion
          GROUP BY duration_min
          ORDER BY duration_min
      `,
      genderPlatform: `
          SELECT gender, platform, COUNT(*) AS total
          FROM Usuario
          GROUP BY gender, platform
      `,
      genderCount: `
          SELECT gender, COUNT(*) AS total
          FROM Usuario
          GROUP BY gender
      `,
      accuracyPerLevel: `
          SELECT n.nombre AS levelName, ROUND(AVG(i.porcentaje_aciertos), 2) AS avgAccuracy
          FROM IntentoNivel i
          JOIN Nivel n ON i.id_nivel = n.id_nivel
          GROUP BY n.nombre
          ORDER BY n.id_nivel;
      `,
      logrosPorNivel: `
          SELECT 
              n.nombre AS nivel,
              l.nombre AS logro,
              ROUND(COUNT(*) * 100.0 / (
                  SELECT COUNT(*) 
                  FROM IntentoNivel i2 
                  WHERE i2.id_nivel = i.id_nivel
              ), 1) AS porcentaje
          FROM LogroUsuario lu
          JOIN Logro l ON l.id_logro = lu.id_logro
          JOIN Usuario u ON u.id_usuario = lu.id_usuario
          JOIN IntentoNivel i ON i.id_usuario = u.id_usuario
          JOIN Nivel n ON i.id_nivel = n.id_nivel
          GROUP BY n.nombre, l.nombre
          ORDER BY n.nombre, l.id_logro
      `,
      newUsersByDay: `
          SELECT DATE(creationDate) AS day, COUNT(*) AS count
          FROM Usuario
          WHERE creationDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY day
          ORDER BY day ASC
      `
  };

  let connection;
  try {
      connection = await getDBConnection();
      const results = {};
      for (const [key, query] of Object.entries(sql)) {
          const [rows] = await connection.execute(query);
          results[key] = rows;
      }

      res.render("dashboard/index", {
          username: req.session.username,
          users: results.users,
          totalUsers: results.totalUsers[0]?.total ?? 0,
          avgSession: results.avgSession[0]?.avg ?? 0,
          countries: results.countries[0]?.total ?? 0,
          activeToday: results.activeToday[0]?.total ?? 0,
          sessionsThisWeek: results.thisWeek[0]?.total ?? 0,
          topDevice: results.topDevice[0]?.deviceModel ?? "N/A",
          topLanguage: results.topLanguage[0]?.systemLanguage ?? "N/A",
          topPlatform: results.topPlatform[0]?.platform ?? "N/A",
          sessionsByDay: results.sessionsByDay,
          countriesPie: results.countriesPie,
          durationHistogram: results.durationHistogram,
          genderPlatform: results.genderPlatform,
          genderCount: results.genderCount,
          accuracyPerLevel: results.accuracyPerLevel,
          logrosPorNivel: results.logrosPorNivel,
          newUsersByDay: results.newUsersByDay
      });

  } catch (err) {
      console.error("❌ Error en dashboard:", err);
      res.status(500).send("Error en el dashboard");
  } finally {
      if (connection) await connection.end();
  }
});


// ======================= 📈 Rutas de visualización (patterns) =======================
app.get("/sessions/patterns/data", async (req, res) => {
  if (!req.session.authenticated) return res.status(401).json({ error: "No autorizado" });

  let connection;
  try {
    connection = await getDBConnection();

    const [rows] = await connection.execute(`
      SELECT
        DATE_FORMAT(CONVERT_TZ(startTime, '+00:00', '-06:00'), '%W') AS weekday,
        DATE_FORMAT(CONVERT_TZ(startTime, '+00:00', '-06:00'), '%l%p') AS hour,
        COUNT(*) AS value
      FROM Sesion
      GROUP BY weekday, hour
    `);

    // Días y horas en el orden esperado por el frontend
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const hours = [
      "12AM", "1AM", "2AM", "3AM", "4AM", "5AM",
      "6AM", "7AM", "8AM", "9AM", "10AM", "11AM",
      "12PM", "1PM", "2PM", "3PM", "4PM", "5PM",
      "6PM", "7PM", "8PM", "9PM", "10PM", "11PM"
    ];

    // Transformar a formato [x, y, value]
    const transformedData = rows.map(row => {
      return [
        hours.indexOf(row.hour),
        days.indexOf(row.weekday),
        row.value
      ];
    });

    res.json({
      hours,
      days,
      data: transformedData
    });

  } catch (err) {
    console.error("❌ Error al obtener datos del heatmap:", err);
    res.status(500).json({ error: "Error al obtener datos" });
  } finally {
    if (connection) await connection.end();
  }
});

app.get("/sessions/patterns", async (req, res) => {
  if (!req.session.authenticated) return res.redirect("/login");

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.render("sessions/patterns", { username: req.session.username });
});

app.get("/sessions/gantt/data", async (req, res) => {
  if (!req.session.authenticated) return res.status(401).json({ error: "No autorizado" });

  let connection;
  try {
    connection = await getDBConnection();

    const [rows] = await connection.execute(`
      SELECT
        u.userName AS category,
        DATE_FORMAT(CONVERT_TZ(s.startTime, '+00:00', '-06:00'), '%Y-%m-%d %H:%i') AS fromDate,
        DATE_FORMAT(CONVERT_TZ(s.endTime, '+00:00', '-06:00'), '%Y-%m-%d %H:%i') AS toDate
      FROM Sesion s
      JOIN Usuario u ON u.id_usuario = s.id_usuario
      WHERE s.startTime IS NOT NULL AND s.endTime IS NOT NULL
      ORDER BY s.startTime DESC
      LIMIT 50
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener sesiones para Gantt:", err);
    res.status(500).json({ error: "Error al obtener sesiones" });
  } finally {
    if (connection) await connection.end();
  }
});
// ======================= 🛠️ Para custom dashboard =======================

app.get("/sessions/custom", async (req, res) => {
    if (!req.session.authenticated) return res.redirect("/login");

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const sql = {
        sessionsByDay: `
            SELECT DATE(startTime) as day, COUNT(*) AS count
            FROM Sesion
            WHERE startTime >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)
            GROUP BY day
            ORDER BY day ASC
        `,
        countriesPie: `
            SELECT country, COUNT(*) AS total
            FROM Usuario
            GROUP BY country
            ORDER BY total DESC
            LIMIT 10
        `,
        durationHistogram: `
            SELECT FLOOR(duration_seconds / 60) AS duration_min, COUNT(*) AS count
            FROM Sesion
            GROUP BY duration_min
            ORDER BY duration_min
        `,
        genderPlatform: `
            SELECT gender, platform, COUNT(*) AS total
            FROM Usuario
            GROUP BY gender, platform
        `
    };

    let connection;
    try {
        connection = await getDBConnection();
        const results = {};

        for (const [key, query] of Object.entries(sql)) {
            const [rows] = await connection.execute(query);
            results[key] = rows;
        }

        res.render("sessions/custom", {
            username: req.session.username,
            sessionsByDay: results.sessionsByDay,
            countriesPie: results.countriesPie,
            durationHistogram: results.durationHistogram,
            genderPlatform: results.genderPlatform
        });

    } catch (err) {
        console.error("❌ Error en /sessions/custom:", err);
        res.status(500).send("Error al cargar el dashboard personalizado");
    } finally {
        if (connection) await connection.end();
    }
});

// ======================= 👤👤 Usuarios  =======================

app.get("/dashboard/users", async (req, res) => {
  if (!req.session.authenticated) return res.redirect("/login");

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');


  let connection;
   try {
      connection = await getDBConnection();
      const [users] = await connection.execute(`
        SELECT id_usuario, userName, email, country, deviceModel, systemLanguage
        FROM Usuario
        ORDER BY userName ASC
      `);


      res.render("users/users", {
          username: req.session.username,
          users
      });

  } catch (err) {
      console.error("❌ Error al cargar usuarios:", err);
      res.status(500).send("Error al obtener usuarios");
  } finally {
      if (connection) await connection.end();
  }
});

// ==================== 👤 Usuario individual ====================
app.get("/users/users/:id", async (req, res) => {
  if (!req.session.authenticated) return res.redirect("/login");

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const userId = req.params.id;
  let connection;

  try {
    connection = await getDBConnection();

    const [[user]] = await connection.execute(
      `SELECT * FROM Usuario WHERE id_usuario = ?`,
      [userId]
    );

    const [sessions] = await connection.execute(
      `SELECT * FROM Sesion WHERE id_usuario = ? ORDER BY startTime DESC`,
      [userId]
    );

    if (!user) return res.status(404).send("Usuario no encontrado");

    res.render("users/details", {
      username: req.session.username,
      user,
      sessions
    });

  } catch (err) {
    console.error("❌ Error al cargar perfil:", err);
    res.status(500).send("Error al cargar usuario");
  } finally {
    if (connection) await connection.end();
  }
});

// ======================= Guardar progreso del usuario  =======================
app.post("/saveLevelCompleted", async (req, res) => { // Esta ruta registra los intentos por nivel del usuario
  console.log('⭐ INICIO: saveLevelCompleted');
  console.log('Datos recibidos:', req.body);

  // Recibe de Unity el id del usuario, el id del nivel y el número de aciertos en el quiz
  const {id_usuario, level_id, aciertos, tiempo_finalizacion} = req.body;

  if (!id_usuario || !level_id || aciertos === undefined) {
    console.log('❌ Error: Valores requeridos faltantes');
    return res.json({ done: false, message: "Faltan campos" });
  }

  // Conecta a la base de datos
  let connection;
  try {
      connection = await getDBConnection();

      const [userCheck] = await connection.execute(
        "SELECT id_usuario FROM Usuario WHERE id_usuario = ?",
        [id_usuario]
     );
    
      if (userCheck.length === 0) {
          return res.json({ done: false, message: "Usuario no encontrado" });
      }

      const [resultado] = await connection.execute(
        "CALL CalcularPorcentajeAciertos(?, ?)",
        [level_id, aciertos]
      );

      const porcentaje = resultado[0][0].porcentaje;  
      const puntaje = aciertos * 200; // Calcular puntaje

      // Definir inserción a la tabla IntentoNivel
      const insertSQL = `
          INSERT INTO IntentoNivel 
          (id_usuario, id_nivel, puntaje, porcentaje_aciertos, tiempo_finalizacion)
          VALUES (?, ?, ?, ?, ?)
      `;

      const values = [
          id_usuario, level_id, puntaje, porcentaje, tiempo_finalizacion
      ];

      await connection.execute(insertSQL, values);

      console.log("✅ Intento de nivel guardado");
      res.json({ done: true, message: "Intento de nivel guardado correctamente" });

  } catch (err) {
      console.error("❌ Error al registrar el intento del nivel:", err);
      res.json({ done: false, message: "Error al registrar el intento del nivel" });
  } finally {
      if (connection) await connection.end();
  }
});

// ======================= Get relevant data to load user progress =======================
app.post("/getUserProgress", async (req, res) => { // Esta ruta regresa una tabla con los mejores intentos por nivel del usuario
  console.log('⭐ INICIO: getUserProgress');
  console.log('Datos recibidos:', req.body);

  // Recibe de Unity el id del usuario, el id del nivel y el número de aciertos en el quiz
  const {id_usuario} = req.body;

  if (!id_usuario) {
    console.log('❌ Error: ID requerido faltante');
    return res.json({ done: false, message: "Falta ID de usuario" });
  }

  // Conecta a la base de datos
  let connection;
  try {
      connection = await getDBConnection();

      const [userCheck] = await connection.execute(
        "SELECT id_usuario FROM Usuario WHERE id_usuario = ?",
        [id_usuario]
     );
    
      if (userCheck.length === 0) {
          return res.json({ done: false, message: "Usuario no encontrado" });
      }

      const [resultado] = await connection.execute(
        "SELECT id_nivel AS level_id, MIN(tiempo_finalizacion) AS time FROM IntentoNivel WHERE id_usuario = ? GROUP BY id_nivel",
        [id_usuario]
      );

      console.log("✅ Progreso obtenido:", resultado);
      res.json({ 
          done: true, 
          message: "Progreso obtenido correctamente",
          progress: resultado
      });

  } catch (err) {
      console.error("❌ Error al obtener el progreso", err);
      res.json({ done: false, message: "Error al obtener el progreso" });
  } finally {
      if (connection) await connection.end();
  }
});

// ======================= Generate leaderboard to insert it into Unity =======================
app.get("/generateLeaderboard", async (req, res) => { // Esta ruta llama a un procedimiento almacenado para obtener el ranking de los usuarios
  console.log('⭐ INICIO: generateLeaderboard');

  // Conecta a la base de datos
  let connection;
  try {
      connection = await getDBConnection();

      const [leaderboard] = await connection.execute(
        "CALL GenerarLeaderboard(1)"
     );
    
      if (leaderboard.length === 0) {
          return res.json({ done: false, message: "No leaderboard data yet" });
      }

      res.json({ 
          done: true, 
          message: "Progreso obtenido correctamente",
          leaderboard: leaderboard[0]
      });

  } catch (err) {
      console.error("❌ Error al obtener el leaderboard", err);
      res.json({ done: false, message: "Error al obtener el leaderboard" });
  } finally {
      if (connection) await connection.end();
  }
});

// ==================== 🏠 Home pública ====================
app.get("/home", (req, res) => {
  res.render("publicViews/home");
});

// ==================== 🔊 INICIAR SERVIDOR ====================
app.listen(port, () => {
    console.log(`Servidor esperando en: http://${ipAddress}:${port}`);
});

// ======================= 🚪 Logout + 404 ======================= CHECAR <<<<<<<<<<<<<<<<<<
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error al cerrar sesión." });
    }
    res.redirect("/login");
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).json({ message: "Error al cerrar sesión." });
      }
      res.redirect("/login");
  });
});

// Página de recurso no encontrado (estatus 404)
app.use((req, res) => {
  const url = req.originalUrl;
  res.status(404).render('partials/not_found', { url });
});
