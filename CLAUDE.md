# Newcom Manager — Contexto de Proyecto para Claude Code

## 1. Qué estamos construyendo

**Newcom Manager** es una app mobile (React Native) para que entrenadores de Newcom
gestionen sus equipos sin usar papel ni planillas. Reemplaza: fichas de jugadores en
papel, listas de asistencia a mano, cuadernos de ejercicios, y calendarios de torneos
dispersos.

**Audiencia crítica:** entrenadores de 40 a 80 años, baja familiaridad tecnológica,
posibles dificultades visuales/auditivas. Este perfil de usuario condiciona TODAS las
decisiones de UI: si dudás entre "elegante" y "obvio", elegí obvio.

**Alcance de esta fase (MVP):** un solo rol, el Entrenador/Administrador. No hay rol
"Jugador" todavía (eso es Fase 2, no lo sobre-construyas ahora, pero dejá el modelo de
datos preparado para no tener que migrar feo después).

**Estrategia de distribución (importante, condiciona el build):** esta primera etapa
NO se publica en Google Play ni App Store. Se distribuye como **APK de Android
instalado manualmente** a un grupo piloto de 3-5 entrenadores conocidos, para validar
el flujo real de asistencia offline en la cancha antes de gastar tiempo/dinero en
tiendas. Foco 100% Android en esta fase — iOS y la publicación oficial en ambas
tiendas son una fase posterior, no la desarrolles ni la optimices todavía. Ver
sección 8.5 para el detalle de cómo armar ese build.

---

## 2. Stack técnico (decidido)

- **Frontend:** React Native con Expo (managed workflow, salvo que alguna integración
  nativa fuerce eject — evaluar caso por caso y avisar antes de hacerlo).
- **Plataforma de esta fase:** solo Android (compilado como APK standalone para el
  piloto). No configurar nada específico de iOS todavía — ni certificados, ni
  ajustes de `app.json` para iOS, ni testeo en simulador de iPhone. Eso arranca
  recién cuando pasemos a la fase de publicación oficial.
- **Backend/DB:** Supabase (ya existe una cuenta creada — pedir las credenciales/URL
  del proyecto antes de generar el `.env`, no inventarlas).
- **Local-first / Offline:** Supabase no tiene offline-sync nativo tan maduro como
  Firebase, así que la estrategia es:
  - Base de datos local con **WatermelonDB** o **op-sqlite / expo-sqlite** como cache
    local de escritura inmediata.
  - Cola de sincronización propia: cada acción offline (tomar asistencia, crear
    jugador, etc.) se guarda localmente con estado `pending_sync` y un timestamp, y
    se reintenta subir a Supabase cuando vuelve la conexión (usar `NetInfo` de
    React Native para detectar conectividad).
  - Definir estrategia de resolución de conflictos simple: **last-write-wins** por
    campo, salvo asistencia (que es append-only, no debería tener conflictos reales).
  - Este punto es el más delicado del proyecto: antes de implementarlo, proponeme
    el diseño de la cola de sync y el esquema de las tablas `_local` antes de escribir
    código.
- **Autenticación:** Supabase Auth con **Phone OTP (SMS)**. Sin contraseñas.
- **Pagos/Suscripción:** RevenueCat (integrar cuando el MVP funcional esté listo,
  no es prioridad de la primera iteración, y no aplica hasta que haya tienda).
- **WhatsApp:** integración simple vía `wa.me` / `Linking.openURL` con mensaje
  pre-cargado (URL-encoded). Sin Business API, sin aprobaciones de Meta.
- **Google Calendar:** sincronización de entrenamientos/torneos vía Google Calendar
  API (OAuth). Esto también es de segunda prioridad frente al core offline-first.

---

## 3. Funcionalidades del MVP (en orden de prioridad de desarrollo)

1. **Auth** — login por OTP SMS con Supabase.
2. **Gestión de equipo** — alta/edición/baja de jugadores: nombre, contacto
   (teléfono, WhatsApp), fecha de nacimiento, estado de apto médico (vigente/vencido/
   fecha de vencimiento), notas libres. Confirmación obligatoria antes de borrar.
3. **Asistencia** — pantalla de toma rápida por sesión: lista de jugadores con toggle
   presente/ausente, funciona 100% offline, sincroniza sola. Esta es LA feature que
   valida el producto — tiene que ser la más pulida y la más simple de todas.
4. **Ejercicios** — biblioteca de prácticas (texto + opcionalmente imagen/video-link) y
   armado de rutinas por sesión.
5. **Torneos** — calendario simple: fecha, rival, lugar, resultado (cargado
   posteriormente). No hace falta bracket ni fixture complejo en el MVP.
6. **WhatsApp** — botón "Enviar alerta al grupo" en asistencia/torneos que abre
   WhatsApp con mensaje pre-armado (ej: "Entrenamos hoy a las 19hs en [lugar]").
7. **Google Calendar** — sync de entrenamientos y torneos (última prioridad del MVP).

No implementar Fase 2 (rol Jugador) ni RevenueCat hasta que 1–6 estén sólidos.

---

## 4. Reglas de UI/UX (no negociables)

- Área táctil mínima **48x48px** en todo elemento interactivo, con espaciado
  generoso entre botones (evitar toques accidentales).
- Toda acción destructiva (borrar jugador, cancelar torneo, etc.) requiere
  confirmación explícita con diálogo, nunca "deshacer silencioso".
- Tipografía grande por defecto, alto contraste, y respetar la configuración de
  tamaño de fuente del sistema operativo (no hardcodear tamaños que ignoren el
  accessibility scaling del teléfono).
- Tono visual sobrio: paleta de colores limitada, sin animaciones decorativas,
  sin saturación de íconos. Priorizar texto claro sobre iconografía ambigua.
- Cada pantalla debe poder entenderse sin tutorial — si una función necesita
  explicación, es que la UI está mal resuelta, no que falte un tooltip.
- Feedback inmediato y visible para toda acción (ej: "Guardado" o ícono de estado
  de sincronización pendiente/completa), especialmente relevante en modo offline
  para que el entrenador sepa que su acción "quedó guardada" aunque no haya señal.

---

## 5. Modelo de datos (aprobado, pendiente de credenciales reales para migrar)

Tablas: `coaches`, `teams`, `players`, `attendance_sessions`, `attendance_records`,
`exercises`, `routines`, `routine_exercises`, `tournaments`. RLS por `coach_id` /
`team_id` en todas. Ver detalle de columnas en el historial de la conversación de
scaffolding — se migra recién cuando el usuario provea la URL/credenciales reales
del proyecto Supabase.

---

## 6. Modelo de negocio (para tener en cuenta en el diseño, no implementar aún)

- Freemium: plan gratuito = 1 equipo, hasta 15 jugadores, funciones básicas.
  Plan Pro = equipos ilimitados, estadísticas de asistencia, ejercicios avanzados.
- Diseñar el modelo de datos y las validaciones pensando en que estos límites se
  van a activar después (ej: que sea fácil chequear "cantidad de jugadores del
  team" sin refactor).

## 7. Métricas a instrumentar (cuando haya analytics, no en el MVP inicial)

- Activation rate (coach agrega ≥5 jugadores)
- WAU (aperturas ≥2 veces/semana)
- Tasa de abandono de acciones a medio camino
- Conversión free → pago

---

## 8. Cómo quiero trabajar con vos (Claude Code) en este proyecto

- Andá por fases: no generar el proyecto entero de una. Empezar por
  scaffolding (Expo + estructura de carpetas + conexión a Supabase) y esperar
  confirmación antes de seguir con la siguiente feature de la lista de la sección 3.
- Antes de tocar el esquema de Supabase o la lógica de sincronización offline,
  explicar el plan en texto antes de escribir código.
- Priorizar simplicidad sobre "prolijidad arquitectónica" — este proyecto lo
  mantiene el usuario, no un equipo grande. Evitar abstracciones que no se usan
  todavía.
- Cuando se termine una feature, avisar qué falta probar manualmente antes de dar
  por cerrada esa parte (sobre todo lo offline: simular avión, tomar asistencia,
  reconectar, verificar que sincronizó).
- Usar TypeScript en todo el proyecto.
- No implementar WhatsApp Business API, ni rol Jugador, ni RevenueCat hasta que
  se pida explícitamente — están fuera de scope del MVP.

---

## 8.5. Fase piloto: build y distribución vía APK

- **Perfil de build:** `eas.json` con un profile `preview` que genere `.apk`
  (`"buildType": "apk"`), no `.aab`. El `.aab` solo hace falta al publicar en Play.
- **Firma:** keystore autogestionado por EAS Build (`eas build` lo gestiona solo).
  Guardar copia del keystore generado por si el día de mañana se migra a Play Store
  con el mismo package name.
- **Distribución:** el build queda en un link de descarga de Expo, que se comparte
  por WhatsApp a los entrenadores piloto. Sin hosting propio.
- **EAS Update desde el arranque:** para empujar cambios de JS/UI a los pilotos sin
  pedir reinstalación del APK. Reservar un nuevo build completo (con reinstalación)
  solo para cambios de código nativo o config (permisos, ícono, nombre).
- **Instructivo de instalación:** pendiente, se redacta en conjunto cuando se llegue
  a esa etapa (Android bloquea "orígenes desconocidos" por defecto).
- **Qué NO hacer en esta fase:** no configurar Google Play Console, no generar
  `.aab`, no tocar nada de App Store/iOS, no integrar RevenueCat.

---

## 9. Estado del proyecto

- Scaffolding completo: Expo + TypeScript, Expo Router (grupos `(auth)`/`(tabs)`),
  estructura de `src/` (`db`, `sync`, `components`, `hooks`, `theme`, `utils`).
  Repo git propio y aislado (ya no hereda el `.git` de nivel superior), remote a
  `https://github.com/NoahEritier/Newcom-Manager.git`.
- Proyecto Supabase real conectado (`.env`, gitignoreado). Migración inicial
  (`supabase/migrations/0001_init.sql`) corrida por el usuario: 9 tablas + RLS +
  trigger que crea el `coach` automáticamente al confirmarse el signup.
- **Feature 1 (Auth) terminada y validada en dispositivo real:** login por
  teléfono + OTP vía Twilio Verify, pantallas conectadas de verdad a Supabase,
  sesión persistida (`AsyncStorage`) con auto-refresh, logout. Cuenta de Twilio
  en modo trial — solo manda SMS a números en "Verified Caller IDs".
- Proyecto EAS creado (`@eritiernoah/newcom-manager`), logueado como
  `eritiernoah`. `eas.json` con perfiles `development` (dev client, para seguir
  developeando en dispositivo real sin depender de que Expo Go tenga la misma
  versión de SDK — fue necesario porque Expo Go de Play Store iba atrasado
  respecto al SDK 57 del proyecto), `preview` (APK piloto) y `production`
  (a futuro, no usar todavía). `.npmrc` con `legacy-peer-deps=true` (necesario
  por conflicto de peer deps entre `expo-router`/`@expo/ui` y `react-dom`, tanto
  local como en el builder remoto de EAS).
- **Feature 2 (Gestión de equipo) terminada y validada en dispositivo real:**
  alta/edición/baja (lógica, `is_active=false`) de jugadores, con nombre,
  teléfono, WhatsApp, fecha de nacimiento, apto médico (vigente/vencido/sin
  dato) + vencimiento, notas, y confirmación obligatoria antes de borrar.
  No hay pantalla de gestión de equipos todavía: se crea un equipo "Mi equipo"
  automático la primera vez que el coach entra a la tab (plan free = 1 equipo).
  Requirió agregar `@react-native-community/datetimepicker` (módulo nativo,
  implicó un rebuild del development client — los cambios JS/UI normales NO
  requieren reinstalar el APK, solo cambios nativos o de config).
- **Feature 3 (Asistencia) implementada con offline-first real:** cola de sync
  propia sobre `expo-sqlite` (no WatermelonDB — se prefirió por más simple y
  liviano, sin config nativa extra). Tablas locales `players_cache` (cache de
  lectura), `attendance_sessions_local` y `attendance_records_local` (con
  `sync_status`/`updated_at` para push, y pull con last-write-wins por fila).
  Solo Asistencia funciona offline; Equipo/Torneos/Ejercicios siguen
  online-first a propósito (no era requisito). Sync dispara con `NetInfo` al
  reconectar + botón manual, con indicador de "pendientes de subir" en pantalla.
  Pendiente de validar en dispositivo real (crear sesión, marcar presente/
  ausente en modo avión, reconectar y confirmar que sincroniza).
- **Feature 3 (Asistencia) validada en dispositivo real**, incluido offline
  (modo avión + reconexión).
- **Identidad visual aplicada** (guía de diseño del usuario): paleta azul
  marino/ámbar, tipografía Atkinson Hyperlegible en toda la app, Material
  Icons Filled en la tab bar. Ícono de app y splash screen generados a partir
  de un asset de pelota provisto por el usuario (ver `src/theme/index.ts`
  para la paleta completa).
- **Modo claro/oscuro con toggle manual** (no sigue el tema del sistema):
  default claro, elegido explícitamente por el usuario, persistido en
  `AsyncStorage` vía `ThemeModeProvider` (`src/hooks/useThemePreference.tsx`).
  Botón de sol/luna en el header de las 4 tabs.
- **Feature 4 (Ejercicios) implementada:** biblioteca con categoría (lista
  fija: entrada en calor/técnica/táctica/físico/otro — no configurable por el
  usuario, para no sobre-construir), duración estimada, materiales,
  descripción, link de imagen/video. Buscador + filtro por categoría.
- **Rutinas reconstruidas como biblioteca reutilizable** (ya no atadas 1:1 a
  una sesión): favoritas, duplicar, reordenar ejercicios con flechas
  subir/bajar (sin drag-and-drop, más accesible para el público objetivo).
  Se vinculan a sesiones de asistencia vía `session_routines`
  (many-to-many) — requiere que la sesión ya esté sincronizada, dado que la
  FK apunta a `attendance_sessions` remota.
- **Feature 5 (Torneos) restructurada:** se separó "torneo" (evento, puede
  durar varios días y agrupar varios partidos — título, fechas, lugar,
  equipos participantes, tarifa, si está pago, de dónde sale la plata,
  asistentes seleccionables de la lista de jugadores) de "partido" (uno
  solo, con fecha/hora/rival/lugar/dirección/marcador — puede pertenecer a
  un torneo o ser suelto/aislado). Tabla `tournaments` (evento),
  `matches` (partido, ex-`tournaments`), `tournament_attendees` (many-to-many
  con `players`). Maps para dirección, resultado derivado en el cliente
  (no se duplica en la base), resumen de temporada, filtro próximos/pasados.
  Se agregó también un **Anotador** (herramienta suelta de puntaje por
  sets, sets/puntos configurables, sin persistencia — solo para seguir el
  partido en vivo en la cancha).
- **Feature 6 (WhatsApp) implementada:** alertas pre-cargadas (`wa.me`) en
  Torneos (convocatoria), Asistencia (aviso de entrenamiento) y Equipo
  (individual desde la ficha del jugador + grupal desde la lista).
- **Equipo ampliado:** nombre, género, categoría y días de entrenamiento
  recurrentes (`training_days`, usados por el mini calendario semanal de
  Asistencia) editables desde "Datos del equipo". Buscador de jugadores,
  badges de apto médico, contacto de emergencia, límite de 15 jugadores del
  plan free con aviso (no bloqueo abrupto a mitad de carga). Preparado para
  multi-equipo a futuro (el modelo ya soporta N equipos por coach; la UI
  sigue asumiendo uno solo por ahora, a pedido explícito del usuario).
- **Asistencia ampliada:** mini calendario de la semana actual (marca días de
  entrenamiento según `training_days` y sesiones ya creadas), hora/ubicación
  editable por sesión (prellenada con el default del equipo), nota corta por
  jugador, marca "editado" con timestamp al corregir una asistencia ya
  sincronizada, botón "marcar todos presentes", borrar sesión (con
  confirmación), % de asistencia por jugador (basado en los últimos 30 días
  cacheados localmente).
- **Google Calendar (sección 3.7) pausada a propósito**: alcance ya propuesto
  (sync one-way app→Calendar, solo torneos + opcionalmente entrenamientos,
  OAuth con scope `calendar.events`) y aprobado por el usuario, pero requiere
  que el usuario cree un proyecto en Google Cloud Console + credenciales OAuth
  antes de poder implementarla — se retoma cuando las tenga. Es la feature de
  menor prioridad del MVP.
- **Migraciones 0002, 0002b y 0003 corridas en Supabase**: ampliación de
  esquema (teams, players, attendance_sessions/records, exercises, routines +
  session_routines nueva, tournaments/matches/tournament_attendees) según la
  spec funcional de pantallas del usuario. La restructuración de `routines`
  (de "1 por sesión" a biblioteca reutilizable) tuvo un incidente de
  migración parcial que dejó `routines`/`routine_exercises` sin políticas RLS
  por un rato — resuelto con 0002b_fix_routines_rls.sql (idempotente, seguro
  de re-correr). 0003 separó `tournaments` (ahora el evento/torneo) de
  `matches` (ex-`tournaments`, ahora el partido individual).
- **Anotador (sección Torneos) movido a tab propia** en la navbar (antes
  vivía como ícono dentro de Torneos). De paso se encontró y corrigió una
  tab fantasma "index" que aparecía sin label/ícono en la barra —
  `app/(tabs)/index.tsx` (el redirect a `/asistencia`) no estaba registrado
  explícitamente en el `Tabs` layout, así que expo-router lo mostraba como
  ruta implícita. Se registra con `options={{ href: null }}` para que el
  redirect siga andando sin aparecer en la barra.
- **"Cerrar sesión" movido** de botón suelto en Asistencia a una opción
  dentro de un ícono de configuración (engranaje) en el header, junto al
  toggle de tema, en las 4 tabs (`src/components/SettingsButton.tsx` +
  `HeaderActions.tsx`).
- **Repo pusheado a GitHub** (`NoahEritier/Newcom-Manager`, rama `master`).
- **EAS Update activado**: se instaló `expo-updates` y se corrió
  `eas update:configure` (agrega `runtimeVersion`/`updates.url` a
  `app.json`). El perfil `preview` de `eas.json` ya tenía `channel: "preview"`
  desde el scaffolding; ahora ese canal funciona de verdad. De acá en más,
  los cambios de JS/UI se despliegan con `eas update --branch preview` (sin
  reinstalar el APK); solo cambios nativos/config siguen necesitando un
  build nuevo. El dev client (perfil `development`) todavía no se
  reconstruyó con `expo-updates` — no lo necesita para seguir developeando
  contra el bundler local.
- **Primer APK `preview` (piloto) generado y validado**: build standalone
  (no dev client), instalable directo sin depender de que corra el
  bundler local. Segundo build hecho ya con EAS Update activo.
- **Estado del MVP: definido por el usuario como "completo cuando estas
  funcionalidades estén funcionando correctamente"** (la spec funcional de
  pantallas completa, no solo las features 1-6 originales). Falta: Google
  Calendar (bloqueada por credenciales externas), validar el APK `preview`
  a fondo en dispositivo (instalación limpia, no upgrade desde dev client),
  y redactar el instructivo de instalación de una pantalla (sección 8.5)
  antes de repartirlo a los entrenadores piloto.
