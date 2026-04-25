# 📦 Backend — API REST

Servidor Express para la gestión de usuarios, productos y kits de inventario. Construido con **Node.js**, **Express 5**, **MySQL2** y autenticación mediante **JWT**.

---

## 🚀 Inicio rápido

```bash
# Instalar dependencias
npm install

# Modo desarrollo (con recarga automática)
npm run dev

# Modo producción
npm start
```

El servidor corre por defecto en `http://localhost:4000` (configurable con la variable de entorno `PORT`).

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz de `/backend` con las siguientes variables:

| Variable     | Descripción                                      |
|--------------|--------------------------------------------------|
| `PORT`       | Puerto del servidor (por defecto `4000`)         |
| `JWT_SECRET` | Clave secreta para firmar y verificar los JWT    |
| `DB_HOST`    | Host de la base de datos MySQL                   |
| `DB_USER`    | Usuario de la base de datos                      |
| `DB_PASSWORD`| Contraseña de la base de datos                   |
| `DB_NAME`    | Nombre de la base de datos                       |

---

## 🔐 Autenticación

La mayoría de los endpoints están **protegidos**. Para acceder a ellos debes incluir el token JWT en el encabezado de cada petición:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer `POST /api/auth/login`. Tiene una vigencia de **8 horas**.

El middleware de autenticación (`authMiddleware.js`) valida el token en cada solicitud protegida y, si es válido, inyecta los datos del usuario en `req.user` para que los controladores puedan acceder a ellos.

**Errores posibles del middleware:**

| Código | Mensaje                                                    | Causa                         |
|--------|------------------------------------------------------------|-------------------------------|
| `401`  | `Token requerido`                                          | No se envió el header         |
| `401`  | `El token ha expirado. Por favor, inicie sesión nuevamente.` | JWT vencido                 |
| `403`  | `Token inválido o alterado.`                               | Firma inválida o manipulada   |

---

## 🌐 Base URL

```
http://localhost:4000/api
```

---

## 📋 Referencia de Endpoints

### ✅ Health Check

---

#### `GET /api/health`

**Propósito:** Verificar que el servidor está activo y respondiendo correctamente. Útil para monitoreo y pruebas de conectividad sin requerir autenticación.

- **Autenticación requerida:** ❌ No
- **Body:** Ninguno

**Respuesta exitosa `200`:**
```json
{
  "status": "ok",
  "message": "Servidor funcionando"
}
```

---

### 👤 Autenticación — `/api/auth`

Endpoints públicos (sin JWT) para registro e inicio de sesión de usuarios.

---

#### `POST /api/auth/register`

**Propósito:** Registrar un nuevo usuario en la plataforma. Antes de guardar, verifica que el correo no esté ya en uso y encripta la contraseña con **bcrypt** (10 rondas de sal) para no almacenarla en texto plano.

- **Autenticación requerida:** ❌ No

**Body (JSON):**

| Campo      | Tipo     | Obligatorio | Descripción                  |
|------------|----------|:-----------:|------------------------------|
| `nombre`   | `string` | ✅           | Nombre completo del usuario  |
| `email`    | `string` | ✅           | Correo electrónico único     |
| `password` | `string` | ✅           | Contraseña en texto plano    |

**Ejemplo de petición:**
```json
{
  "nombre": "Laura García",
  "email": "laura@example.com",
  "password": "miContraseña123"
}
```

**Respuestas:**

| Código | Descripción                                          |
|--------|------------------------------------------------------|
| `201`  | `{ "message": "Usuario creado", "userId": 5 }`       |
| `400`  | `{ "message": "Todos los campos son obligatorios (nombre, email, password)" }` |
| `400`  | `{ "message": "El email ya está registrado" }`       |
| `500`  | Error interno del servidor                           |

---

#### `POST /api/auth/login`

**Propósito:** Autenticar a un usuario existente. Compara la contraseña enviada con el hash almacenado en la base de datos usando `bcrypt.compare`. Si las credenciales son válidas, genera y retorna un **JWT firmado** con vigencia de 8 horas que debe usarse en todas las rutas protegidas.

- **Autenticación requerida:** ❌ No

**Body (JSON):**

| Campo      | Tipo     | Obligatorio | Descripción               |
|------------|----------|:-----------:|---------------------------|
| `email`    | `string` | ✅           | Correo del usuario        |
| `password` | `string` | ✅           | Contraseña en texto plano |

**Ejemplo de petición:**
```json
{
  "email": "laura@example.com",
  "password": "miContraseña123"
}
```

**Respuesta exitosa `200`:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 5,
    "nombre": "Laura García",
    "email": "laura@example.com"
  }
}
```

**Respuestas de error:**

| Código | Descripción                                              |
|--------|----------------------------------------------------------|
| `400`  | `{ "message": "Correo y contraseña son requeridos" }`   |
| `401`  | `{ "message": "Credenciales incorrectas" }` (usuario no existe o contraseña inválida) |
| `500`  | Error interno del servidor                               |

> **Nota de seguridad:** Tanto si el usuario no existe como si la contraseña es incorrecta, se devuelve el mismo mensaje `"Credenciales incorrectas"`. Esto es intencional para evitar la enumeración de usuarios existentes.

---

### 📦 Productos — `/api/products`

CRUD completo para la gestión de productos del inventario. Todos los endpoints de este grupo **requieren JWT**. Las operaciones de creación, modificación y eliminación generan un **registro de auditoría** (log) asociado al usuario que realizó la acción.

---

#### `GET /api/products`

**Propósito:** Obtener el listado completo de todos los productos registrados en la base de datos. Útil para poblar tablas, selectores y vistas generales del inventario.

- **Autenticación requerida:** ✅ Sí

**Respuesta exitosa `200`:**
```json
[
  {
    "productoId": 1,
    "nombre": "Cable HDMI",
    "descripcion": "Cable HDMI 2.0 de 2 metros",
    "costo": 8500,
    "precio": 15000,
    "stock": 50
  },
  {
    "productoId": 2,
    "nombre": "Mouse USB",
    "descripcion": null,
    "costo": 12000,
    "precio": 22000,
    "stock": 30
  }
]
```

---

#### `GET /api/products/:id`

**Propósito:** Obtener los datos de un único producto a partir de su ID. Devuelve `404` si no existe, lo que permite al cliente manejar el error de forma clara.

- **Autenticación requerida:** ✅ Sí
- **Parámetro de ruta:** `id` — ID numérico del producto

**Respuesta exitosa `200`:**
```json
{
  "productoId": 1,
  "nombre": "Cable HDMI",
  "descripcion": "Cable HDMI 2.0 de 2 metros",
  "costo": 8500,
  "precio": 15000,
  "stock": 50
}
```

**Respuestas de error:**

| Código | Descripción                               |
|--------|-------------------------------------------|
| `404`  | `{ "message": "Producto no encontrado" }` |
| `500`  | Error interno del servidor                |

---

#### `POST /api/products`

**Propósito:** Crear un nuevo producto en el inventario. Solo `nombre` y `stock` son obligatorios; los demás campos son opcionales. Al crearse exitosamente, se registra un log de auditoría con el ID del producto y su nombre.

- **Autenticación requerida:** ✅ Sí

**Body (JSON):**

| Campo         | Tipo      | Obligatorio | Descripción                        |
|---------------|-----------|:-----------:|------------------------------------|
| `nombre`      | `string`  | ✅           | Nombre del producto                |
| `stock`       | `number`  | ✅           | Cantidad disponible en inventario  |
| `descripcion` | `string`  | ❌           | Descripción opcional del producto  |
| `costo`       | `number`  | ❌           | Precio de costo (compra)           |
| `precio`      | `number`  | ❌           | Precio de venta al público         |

**Ejemplo de petición:**
```json
{
  "nombre": "Teclado mecánico",
  "descripcion": "Teclado TKL con switches Cherry MX Blue",
  "costo": 45000,
  "precio": 89000,
  "stock": 15
}
```

**Respuesta exitosa `201`:**
```json
{
  "message": "Producto creado",
  "productId": 8
}
```

**Respuestas de error:**

| Código | Descripción                                         |
|--------|-----------------------------------------------------|
| `400`  | `{ "message": "nombre y stock son obligatorios" }`  |
| `500`  | Error interno del servidor                          |

---

#### `PATCH /api/products/:id`

**Propósito:** Actualizar parcialmente uno o más campos de un producto existente. Soporta actualizaciones parciales: no es necesario enviar todos los campos, solo los que se desean modificar. Registra un log de auditoría tras la actualización.

- **Autenticación requerida:** ✅ Sí
- **Parámetro de ruta:** `id` — ID numérico del producto

**Body (JSON):** Cualquier subconjunto de los campos del producto.

| Campo         | Tipo      | Descripción                        |
|---------------|-----------|------------------------------------|
| `nombre`      | `string`  | Nuevo nombre del producto          |
| `descripcion` | `string`  | Nueva descripción                  |
| `costo`       | `number`  | Nuevo costo de compra              |
| `precio`      | `number`  | Nuevo precio de venta              |
| `stock`       | `number`  | Nueva cantidad en inventario       |

**Ejemplo de petición** (solo actualiza precio y stock):
```json
{
  "precio": 95000,
  "stock": 10
}
```

**Respuesta exitosa `200`:**
```json
{
  "message": "Producto actualizado"
}
```

**Respuestas de error:**

| Código | Descripción                                                   |
|--------|---------------------------------------------------------------|
| `400`  | `{ "message": "No se enviaron campos para actualizar" }`      |
| `404`  | `{ "message": "Producto no encontrado" }`                     |
| `500`  | Error interno del servidor                                    |

---

#### `DELETE /api/products/:id`

**Propósito:** Eliminar permanentemente un producto del inventario. Si el producto no existe, retorna `404`. En caso de éxito, registra un log de auditoría con el ID eliminado.

- **Autenticación requerida:** ✅ Sí
- **Parámetro de ruta:** `id` — ID numérico del producto

**Respuesta exitosa `200`:**
```json
{
  "message": "Producto eliminado"
}
```

**Respuestas de error:**

| Código | Descripción                               |
|--------|-------------------------------------------|
| `404`  | `{ "message": "Producto no encontrado" }` |
| `500`  | Error interno del servidor                |

---

### 🎁 Kits — `/api/kits`

Un **kit** es un conjunto de productos agrupados bajo un mismo nombre. El stock de un kit se calcula automáticamente en función de los productos que contiene. Todos los endpoints **requieren JWT** y generan registros de auditoría.

---

#### `GET /api/kits`

**Propósito:** Obtener el listado completo de todos los kits registrados. Retorna un arreglo con los datos básicos de cada kit (sin incluir el detalle de productos).

- **Autenticación requerida:** ✅ Sí

**Respuesta exitosa `200`:**
```json
[
  {
    "kitId": 1,
    "nombre": "Kit de Oficina",
    "descripcion": "Accesorios básicos para oficina",
    "stock": 10
  },
  {
    "kitId": 2,
    "nombre": "Kit Gamer",
    "descripcion": null,
    "stock": 5
  }
]
```

---

#### `GET /api/kits/:id`

**Propósito:** Obtener los datos completos de un kit específico, **incluyendo el listado de productos asociados** con sus cantidades. Realiza dos consultas a la base de datos: una para el kit y otra para sus productos, que luego combina en una sola respuesta.

- **Autenticación requerida:** ✅ Sí
- **Parámetro de ruta:** `id` — ID numérico del kit

**Respuesta exitosa `200`:**
```json
{
  "kitId": 1,
  "nombre": "Kit de Oficina",
  "descripcion": "Accesorios básicos para oficina",
  "stock": 10,
  "productos": [
    {
      "productoId": 1,
      "nombre": "Cable HDMI",
      "cantidad": 2
    },
    {
      "productoId": 3,
      "nombre": "Mouse USB",
      "cantidad": 1
    }
  ]
}
```

**Respuestas de error:**

| Código | Descripción                           |
|--------|---------------------------------------|
| `404`  | `{ "message": "Kit no encontrado" }`  |
| `500`  | Error interno del servidor            |

---

#### `POST /api/kits`

**Propósito:** Crear un nuevo kit. Opcionalmente, permite inicializar el kit con una lista de productos en el mismo request. Si se envían productos, el stock del kit se calcula automáticamente al finalizar la creación. Registra un log de auditoría.

- **Autenticación requerida:** ✅ Sí

**Body (JSON):**

| Campo         | Tipo     | Obligatorio | Descripción                                      |
|---------------|----------|:-----------:|--------------------------------------------------|
| `nombre`      | `string` | ✅           | Nombre del kit                                   |
| `descripcion` | `string` | ❌           | Descripción opcional del kit                     |
| `productos`   | `array`  | ❌           | Lista de productos a asociar al crear el kit     |

Cada elemento del arreglo `productos`:

| Campo       | Tipo     | Descripción                      |
|-------------|----------|----------------------------------|
| `productoId`| `number` | ID del producto a agregar al kit |
| `cantidad`  | `number` | Cantidad de ese producto en el kit|

**Ejemplo de petición:**
```json
{
  "nombre": "Kit Gamer",
  "descripcion": "Periféricos para gaming",
  "productos": [
    { "productoId": 2, "cantidad": 1 },
    { "productoId": 5, "cantidad": 1 }
  ]
}
```

**Respuesta exitosa `201`:**
```json
{
  "message": "Kit creado",
  "kitId": 3
}
```

**Respuestas de error:**

| Código | Descripción                              |
|--------|------------------------------------------|
| `400`  | `{ "message": "nombre es obligatorio" }` |
| `500`  | Error interno del servidor               |

---

#### `PATCH /api/kits/:id`

**Propósito:** Actualizar parcialmente los campos de un kit existente (nombre, descripción, etc.). No actualiza los productos asociados; para eso se usan los endpoints específicos de productos del kit. Registra un log de auditoría.

- **Autenticación requerida:** ✅ Sí
- **Parámetro de ruta:** `id` — ID numérico del kit

**Body (JSON):** Cualquier subconjunto de los campos del kit.

**Ejemplo de petición:**
```json
{
  "nombre": "Kit Gamer Pro",
  "descripcion": "Periféricos premium para gaming"
}
```

**Respuesta exitosa `200`:**
```json
{
  "message": "Kit actualizado"
}
```

**Respuestas de error:**

| Código | Descripción                                             |
|--------|---------------------------------------------------------|
| `400`  | `{ "message": "No se enviaron campos para actualizar" }`|
| `404`  | `{ "message": "Kit no encontrado" }`                    |
| `500`  | Error interno del servidor                              |

---

#### `POST /api/kits/:id/productos`

**Propósito:** Agregar un producto a un kit ya existente. Tras agregar el producto, **recalcula automáticamente el stock del kit** en función de todos sus productos asociados y retorna el nuevo valor de stock. Registra un log de auditoría.

- **Autenticación requerida:** ✅ Sí
- **Parámetro de ruta:** `id` — ID numérico del kit

**Body (JSON):**

| Campo       | Tipo     | Obligatorio | Descripción                        |
|-------------|----------|:-----------:|------------------------------------|
| `productoId`| `number` | ✅           | ID del producto a agregar          |
| `cantidad`  | `number` | ✅           | Cantidad de ese producto en el kit |

**Ejemplo de petición:**
```json
{
  "productoId": 4,
  "cantidad": 3
}
```

**Respuesta exitosa `200`:**
```json
{
  "message": "Producto agregado al kit",
  "stockCalculado": 8
}
```

**Respuestas de error:**

| Código | Descripción                                                    |
|--------|----------------------------------------------------------------|
| `400`  | `{ "message": "productoId y cantidad son obligatorios" }`      |
| `500`  | Error interno del servidor                                     |

---

#### `DELETE /api/kits/:id/productos/:productoId`

**Propósito:** Remover un producto específico de un kit. Tras la eliminación, **recalcula automáticamente el stock del kit** y retorna el nuevo valor. Si el producto no pertenece al kit, devuelve `404`. Registra un log de auditoría.

- **Autenticación requerida:** ✅ Sí
- **Parámetros de ruta:**
  - `id` — ID numérico del kit
  - `productoId` — ID numérico del producto a remover

**Respuesta exitosa `200`:**
```json
{
  "message": "Producto eliminado del kit",
  "stockCalculado": 5
}
```

**Respuestas de error:**

| Código | Descripción                                             |
|--------|---------------------------------------------------------|
| `404`  | `{ "message": "Producto no encontrado en el kit" }`     |
| `500`  | Error interno del servidor                              |

---

#### `DELETE /api/kits/:id`

**Propósito:** Eliminar un kit completo junto con todas sus asociaciones de productos. Si el kit no existe, retorna `404`. Registra un log de auditoría.

- **Autenticación requerida:** ✅ Sí
- **Parámetro de ruta:** `id` — ID numérico del kit

**Respuesta exitosa `200`:**
```json
{
  "message": "Kit eliminado"
}
```

**Respuestas de error:**

| Código | Descripción                          |
|--------|--------------------------------------|
| `404`  | `{ "message": "Kit no encontrado" }` |
| `500`  | Error interno del servidor           |

---

## 🗂️ Estructura del proyecto

```
backend/
├── server.js               # Punto de entrada, registra rutas y middlewares globales
├── package.json
├── .env                    # Variables de entorno (no subir al repositorio)
└── src/
    ├── config/
    │   └── db.js           # Pool de conexiones a MySQL con mysql2
    ├── controllers/
    │   ├── authController.js     # Lógica de registro e inicio de sesión
    │   ├── productController.js  # Lógica CRUD de productos
    │   └── kitController.js      # Lógica CRUD de kits y manejo de productos del kit
    ├── middlewares/
    │   └── authMiddleware.js     # Verificación y decodificación de JWT
    ├── models/
    │   ├── userModel.js    # Consultas SQL relacionadas a usuarios
    │   ├── productModel.js # Consultas SQL relacionadas a productos
    │   └── kitModel.js     # Consultas SQL relacionadas a kits
    ├── routes/
    │   ├── authRoutes.js   # Define rutas /api/auth/*
    │   ├── productRoutes.js# Define rutas /api/products/*
    │   └── kitRoutes.js    # Define rutas /api/kits/*
    └── services/
        └── logService.js   # Servicio de registro de auditoría (logs de acciones)
```

---

## 📊 Resumen de Endpoints

| Método   | Ruta                                | Auth | Descripción                             |
|----------|-------------------------------------|:----:|-----------------------------------------|
| `GET`    | `/api/health`                       | ❌   | Verificar que el servidor está activo   |
| `POST`   | `/api/auth/register`                | ❌   | Registrar nuevo usuario                 |
| `POST`   | `/api/auth/login`                   | ❌   | Iniciar sesión y obtener JWT            |
| `GET`    | `/api/products`                     | ✅   | Listar todos los productos              |
| `GET`    | `/api/products/:id`                 | ✅   | Obtener un producto por ID              |
| `POST`   | `/api/products`                     | ✅   | Crear un nuevo producto                 |
| `PATCH`  | `/api/products/:id`                 | ✅   | Actualizar campos de un producto        |
| `DELETE` | `/api/products/:id`                 | ✅   | Eliminar un producto                    |
| `GET`    | `/api/kits`                         | ✅   | Listar todos los kits                   |
| `GET`    | `/api/kits/:id`                     | ✅   | Obtener un kit con sus productos        |
| `POST`   | `/api/kits`                         | ✅   | Crear un nuevo kit                      |
| `PATCH`  | `/api/kits/:id`                     | ✅   | Actualizar campos de un kit             |
| `POST`   | `/api/kits/:id/productos`           | ✅   | Agregar un producto a un kit            |
| `DELETE` | `/api/kits/:id/productos/:productoId`| ✅  | Remover un producto de un kit           |
| `DELETE` | `/api/kits/:id`                     | ✅   | Eliminar un kit completo                |

---

## 🛠️ Tecnologías utilizadas

| Paquete         | Versión  | Uso                                          |
|-----------------|----------|----------------------------------------------|
| `express`       | ^5.2.1   | Framework web y manejo de rutas              |
| `mysql2`        | ^3.20.0  | Conexión a base de datos MySQL con promesas  |
| `jsonwebtoken`  | ^9.0.3   | Generación y verificación de tokens JWT      |
| `bcryptjs`      | ^3.0.3   | Hash seguro de contraseñas                   |
| `dotenv`        | ^17.3.1  | Carga de variables de entorno desde `.env`   |
| `cors`          | ^2.8.6   | Habilitación de CORS para peticiones externas|
| `nodemon`       | ^3.1.14  | Reinicio automático en desarrollo            |
