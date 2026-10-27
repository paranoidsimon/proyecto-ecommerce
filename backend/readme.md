# Supermerca - backend

## Arquitectura

El backend sigue el flujo `api router -> service -> MongoDB repository`. `dependencies.js` registra los modelos Mongoose y los servicios mediante el contenedor de `dependency.js`. El middleware global resuelve el token Bearer antes de las rutas, y cada router aplica permisos por rol.

## Puesta en marcha

1. Copia `config.example.js` a `config.js` y configura `port` y `dbConnection`.
2. Instala dependencias con `npm install`.
3. Crea el primer administrador (PowerShell):

   ```powershell
   $env:ADMIN_USERNAME = "admin"
   $env:ADMIN_PASSWORD = "reemplazar-por-una-clave-segura"
   $env:ADMIN_DISPLAY_NAME = "Administrador"
   $env:ADMIN_EMAIL = "admin@example.com"
   npm run create-admin
   ```

   El comando falla si ya existe un administrador y no incluye credenciales por defecto.
4. Inicia el servidor con `npm run dev`.

### Restablecer la contraseña del administrador

Si ya existe el administrador y olvidaste su contraseña, desde PowerShell define el nombre de usuario y escribe la nueva contraseña en el prompt oculto:

```powershell
$env:RESET_ADMIN_USERNAME = "admin"
$env:RESET_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new(
  "",
  (Read-Host "Nueva contraseña" -AsSecureString)
).Password
npm run reset-admin-password
Remove-Item Env:RESET_ADMIN_USERNAME, Env:RESET_ADMIN_PASSWORD
```

El comando solo actualiza la contraseña de una cuenta con rol `admin`, aplica bcrypt y exige al menos 8 caracteres. No guarda la contraseña en el archivo ni la imprime. Haz una copia de seguridad de la base de datos antes de ejecutarlo.

## Roles

- `admin`: administra usuarios y roles; también puede gestionar catálogo y pedidos.
- `seller`: crea/actualiza/elimina productos y gestiona estados de pedidos.
- `customer`: puede registrarse públicamente, consultar productos, mantener un carrito propio y crear/ver sus pedidos.

Los usuarios antiguos con rol `user` se interpretan como `customer`. Las cuentas se vuelven a consultar al usar el token, de modo que eliminar una cuenta o cambiar su rol actualiza sus permisos en la siguiente petición.

## API de ecommerce

Todas las rutas están bajo `/api`. Las rutas protegidas requieren `Authorization: Bearer <authorizationToken>`.

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| POST | `/register` | Público | Registrar cliente; el servidor asigna el rol |
| GET | `/products?search=&category=&minPrice=&maxPrice=&inStock=&sort=` | Público | Buscar y filtrar productos activos (admin/vendedor también ve inactivos); orden: `newest`, `price-asc`, `price-desc`, `name-asc` |
| GET | `/products/:id` | Público | Consultar la ficha de un producto activo (admin/vendedor también puede ver inactivos) |
| GET | `/categories` | Público | Listar categorías con productos activos (admin/vendedor también ve categorías de productos inactivos) |
| POST/PATCH/DELETE | `/products[/:id]` | Admin, vendedor | Gestionar catálogo e inventario |
| GET | `/cart` | Cliente | Consultar carrito persistente |
| POST | `/cart/:productId` | Cliente | Agregar una unidad |
| PUT/DELETE | `/cart/:productId` | Cliente | Cambiar cantidad / quitar producto |
| POST | `/checkout` | Cliente | Validar y descontar inventario, registrar pedido pendiente |
| GET | `/orders` | Autenticado | Ver pedidos propios (cliente) o todos (admin/vendedor) |
| PATCH | `/orders/:id/status` | Admin, vendedor | Actualizar estado; cancelar repone inventario |
| GET/POST/PATCH/DELETE | `/users[/:username]` | Admin | Administrar cuentas y roles |
| POST | `/login` | Público | Crear una sesión y obtener el token Bearer |

El checkout registra la orden pero no procesa pagos. Los importes se calculan con el precio del catálogo en servidor, nunca con un valor enviado por el navegador.