# Tienda de material — Club Patinaje Flip

Web para que los padres pidan y paguen el material del club (chaquetas,
maillots, mallas, etc.) online, en vez de por WhatsApp. Cada pedido queda
registrado con quién lo ha hecho, qué ha pedido y si está pagado.

## Qué incluye

- **Registro e inicio de sesión (`/registro`, `/login`)**: cada padre/madre
  crea su cuenta con el nombre de su hijo/a (se comprueba contra el
  listado de Klubber, sin enseñárselo a nadie más), su email y una
  contraseña. Sin cuenta no se puede entrar a la tienda.
- **Página principal (`/`)**: catálogo con los 14 artículos del club (del
  PDF "ROPA 2526"), con sus tallas y precios reales. Solo aparece el
  patinador/a propio (o los propios, si hay hermanos) — no el listado de
  todo el club. Se añaden artículos al carrito y se paga con tarjeta a
  través de Stripe.
- **Panel de administración (`/admin`)**: protegido con contraseña (para
  ti, no para los padres). Muestra todos los pedidos (pagados y
  pendientes), permite descargar un CSV y subir un Excel con el listado de
  patinadores exportado de Klubber.
- Los pedidos, las cuentas de los padres y el listado de patinadores se
  guardan en una base de datos (Supabase).

## Importante: ahora Supabase hace falta desde el principio

Antes se podía navegar la tienda sin tener Supabase configurado (con un
listado de ejemplo). Ahora que hay registro e inicio de sesión, **nadie
puede entrar a la tienda hasta que configures Supabase** (paso 2 más
abajo) y subas el listado real de Klubber desde `/admin` — si no, el
registro no encuentra ningún nombre con el que comprobar. Vercel y el
resto puedes dejarlos para después si quieres, pero Supabase ya no es
opcional.

## Antes de nada: cómo funciona el dinero

Con Stripe puedes obtener claves de **modo prueba** (test) en el momento de
crear la cuenta, sin dar ningún dato bancario, y hacer pedidos de prueba
con tarjetas falsas. Solo cuando quieras cobrar dinero real tendrás que
completar la verificación de tu cuenta (datos del club/autónomo y cuenta
bancaria donde quieres recibir los pagos). Así que puedes tener la web
funcionando y probada de verdad antes de decidir activarla en real.

## Puesta en marcha (resumen de pasos)

Como tu web ya está desplegada en Vercel, estos pasos son para activar
todo lo que todavía falta: base de datos, login y pagos.

1. **Sube este código actualizado a tu repositorio de GitHub**: descomprime
   el zip y arrastra todos los archivos otra vez a tu repositorio (igual
   que la primera vez); GitHub detecta los cambios. Vercel vuelve a
   desplegar solo en cuanto haces el commit.

2. **Crear cuenta de Supabase** (gratis) en https://supabase.com
   - Crea un proyecto nuevo (elige una región de Europa).
   - Ve a "SQL Editor" -> "New query", pega el contenido del archivo
     `supabase-schema.sql` de este proyecto y dale a "Run". Esto crea las
     tablas `pedidos`, `patinadores` y `padres`.
   - Ve a "Project Settings" -> "API": copia la "Project URL" (es
     `SUPABASE_URL`) y la clave **service_role** (es
     `SUPABASE_SERVICE_ROLE_KEY`; NO es la "anon public").

3. **Añadir las claves en Vercel**: en tu proyecto de Vercel -> Settings ->
   Environment Variables, añade `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   y `ADMIN_PASSWORD` (la contraseña que tú quieras para entrar en
   `/admin`). Guarda y haz "Redeploy" (Deployments -> los tres puntos del
   último -> Redeploy).

4. **Subir el listado real de Klubber**: entra en `tu-web.vercel.app/admin`
   con tu contraseña y usa el botón "Actualizar listado (Excel Klubber)"
   para subir el Excel exportado desde Klubber con los patinadores. La web
   intenta reconocer sola las columnas de nombre, grupo, tutor y email
   (acepta variaciones como "Patinador", "Alumno", "Categoría"...). Si no
   detecta bien alguna columna, dímelo y ajustamos el reconocimiento.
   **A partir de aquí, los padres ya pueden registrarse** en `/registro`
   (el pago todavía no funcionará hasta el paso 6).

5. **Crear cuenta de Stripe** en https://dashboard.stripe.com/register
   - Ve a "Developers" -> "API keys" y copia la **Secret key** (empieza por
     `sk_test_...`). Añádela en Vercel como `STRIPE_SECRET_KEY`.

6. **Configurar el webhook de Stripe** (para que el pedido se marque como
   "pagado" automáticamente):
   - En Stripe -> Developers -> Webhooks -> "Add endpoint".
   - URL: `https://tu-web.vercel.app/api/webhook`
   - Evento a escuchar: `checkout.session.completed`
   - Copia el "Signing secret" (`whsec_...`) y añádelo en Vercel como
     `STRIPE_WEBHOOK_SECRET`. Vuelve a desplegar (Redeploy) para que se
     aplique.

7. **Probar un pedido de prueba**: regístrate en `/registro` con el nombre
   de un patinador real de tu listado, haz un pedido y paga con la
   tarjeta de pruebas de Stripe `4242 4242 4242 4242`, cualquier fecha
   futura y cualquier CVC. Debería aparecer en `/admin` como "pagado".

8. **Cuando quieras cobrar dinero real**: completa la verificación de tu
   cuenta de Stripe (te la pedirá el propio Stripe cuando actives el modo
   real) y cambia `STRIPE_SECRET_KEY` en Vercel por la clave que empieza
   por `sk_live_...`. Repite el paso 6 del webhook para el modo real (las
   claves de test y de real son independientes).

## Cómo editar el catálogo, precios o tallas

Todo el catálogo está en `lib/catalog.ts`. Cada artículo tiene nombre,
descripción, precio, tallas, si es personalizable (nombre bordado) y la
imagen. Las imágenes están en `public/productos/` (son las páginas del PDF
"ROPA 2526" que me pasaste). Si cambias precios o añades un artículo
nuevo, solo hay que editar ese archivo y desplegar de nuevo.

## Desarrollo en local

```bash
npm install
cp .env.example .env.local   # y rellena las claves
npm run dev
```

## Siguientes pasos posibles (fase 2)

- Horarios de entrenamiento y competiciones por grupo.
- Fotos del club.
- Importación automática de cuotas/competiciones desde Klubber (si
  Klubber permite exportarlo).
- Recuperar contraseña olvidada (de momento, si un padre la olvida, borra
  su fila en la tabla `padres` desde Supabase y que se registre de nuevo).
