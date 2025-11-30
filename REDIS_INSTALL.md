# Guía de Instalación: Redis/Memurai para Windows

## ⚠️ Error Detectado: Permisos Insuficientes

La instalación automática requiere **permisos de Administrador**. Sigue estos pasos:

---

## 📋 Método 1: Chocolatey (RECOMENDADO - Rápido)

### Paso 1: Abrir PowerShell como Administrador

1. Presiona `Win + X` o haz clic derecho en el botón de Inicio
2. Selecciona **"Windows PowerShell (Administrador)"** o **"Terminal (Administrador)"**
3. Cuando aparezca el mensaje de UAC, haz clic en **"Sí"**

### Paso 2: Instalar Memurai

Copia y pega este comando en PowerShell (Administrador):

```powershell
choco install memurai-developer -y
```

**Espera 2-3 minutos** mientras se descarga e instala.

Deberías ver al final:
```
Memurai Developer has been installed successfully!
The install of memurai-developer was successful.
```

### Paso 3: Verificar Instalación

```powershell
# Verificar que Memurai esté instalado
memurai-cli --version

# O también funciona con:
redis-cli --version

# Probar conexión
memurai-cli ping
# Debe retornar: PONG
```

### Paso 4: Verificar Servicio de Windows

```powershell
# Ver estado del servicio
Get-Service Memurai

# Debería mostrar:
# Status   Name               DisplayName
# ------   ----               -----------
# Running  Memurai            Memurai
```

Si el servicio **NO** está corriendo:
```powershell
Start-Service Memurai
```

---

## 📋 Método 2: Instalación Manual (Alternativa)

Si Chocolatey falla, descarga manualmente:

### Paso 1: Descargar Memurai

1. Abre tu navegador
2. Ve a: **https://www.memurai.com/get-memurai**
3. Haz clic en **"Download Memurai Developer"** (versión gratuita)
4. Se descargará: `Memurai-Developer-v4.x.x.msi`

### Paso 2: Ejecutar Instalador

1. Haz doble clic en el archivo `.msi` descargado
2. Sigue el asistente:
   - ✅ Acepta la licencia
   - ✅ Deja la ruta por defecto: `C:\Program Files\Memurai\`
   - ✅ **IMPORTANTE:** Marca la opción **"Install as Windows Service"**
   - ✅ **Puerto:** Deja el predeterminado `6379`
3. Haz clic en **"Install"**
4. Espera a que finalice

### Paso 3: Verificar

Abre PowerShell (no necesita ser Administrador):
```powershell
# Desde cualquier ubicación
memurai-cli ping
# Debe retornar: PONG
```

---

## 📋 Método 3: Redis en WSL2 (Avanzado)

Si tienes WSL2 instalado (Windows Subsystem for Linux):

```bash
# Desde Ubuntu/Debian en WSL
sudo apt update
sudo apt install redis-server -y

# Iniciar Redis
sudo service redis-server start

# Verificar
redis-cli ping
```

**Nota:** Si usas WSL2, actualizar `.env`:
```bash
REDIS_URL=redis://localhost:6379
```

---

## ✅ Confirmar que Todo Funciona

### Test Completo

Abre PowerShell **normal** (no administrador):

```powershell
# Test 1: Ping
redis-cli ping
# Esperado: PONG

# Test 2: Escribir y leer datos
redis-cli set test "Hola UMG"
# Esperado: OK

redis-cli get test
# Esperado: "Hola UMG"

# Test 3: Verificar información del servidor
redis-cli info server
# Debe mostrar: versión de Memurai, modo standalone, etc.
```

### Configurar en el Proyecto

1. **Crear/Actualizar archivo `.env`**

```powershell
cd C:\Users\azuce\OneDrive\Escritorio\TesisProyect

# Si no existe .env, copiarlo
Copy-Item .env.example .env

# Abrir en VS Code
code .env
```

2. **Verificar estas líneas en `.env`:**

```bash
# Redis Local
REDIS_URL=redis://localhost:6379
```

3. **Instalar dependencia de Node.js:**

```powershell
npm install ioredis
```

---

## 🛠️ Solución de Problemas

### Problema 1: "memurai-cli no reconocido como comando"

**Solución:** Agregar Memurai al PATH manualmente

```powershell
# Verificar ubicación de instalación
Test-Path "C:\Program Files\Memurai\memurai-cli.exe"

# Si existe, agregar al PATH de la sesión actual
$env:Path += ";C:\Program Files\Memurai"

# Probar de nuevo
memurai-cli ping
```

### Problema 2: Servicio no inicia

```powershell
# Ver logs del servicio
Get-EventLog -LogName Application -Source Memurai -Newest 10

# Reiniciar el servicio
Restart-Service Memurai
```

### Problema 3: Puerto 6379 en uso

```powershell
# Ver qué proceso está usando el puerto
netstat -ano | findstr :6379

# Si hay otro proceso, puedes:
# Opción A: Matar ese proceso
# Opción B: Cambiar puerto de Memurai (requiere editar configuración)
```

---

## 🎯 Siguiente Paso

Una vez que `redis-cli ping` retorne **PONG**, vuelve conmigo y confirma:

**"Redis instalado correctamente"**

Entonces procederemos a:
1. ✅ Configurar el cliente Redis en el proyecto
2. ✅ Probar la conexión desde Node.js
3. ✅ Comenzar la Fase 1: Transacciones ACID

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún error específico durante la instalación, copia el mensaje de error completo y compártelo conmigo para ayudarte a resolverlo.
