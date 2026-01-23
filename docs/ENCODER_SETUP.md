# 🎥 Configuración del Encoder para Streaming

Esta guía te ayudará a configurar tu encoder (OBS Studio, vMix, Wirecast, etc.) para transmitir a tu servidor RTMP.

## 📋 Información Necesaria

Antes de comenzar, necesitas:

1. **URL del servidor RTMP**: `rtmp://tu-servidor.com/live`
2. **Stream Key**: Lo obtienes del panel administrativo al crear un evento

## 🎬 OBS Studio (Recomendado - Gratis)

### Instalación

1. Descargar de https://obsproject.com/
2. Instalar en tu computadora

### Configuración

1. **Abrir OBS Studio**

2. **Ir a Configuración → Stream**
   - Servicio: `Custom...`
   - Servidor: `rtmp://tu-servidor.com/live`
   - Stream Key: `[tu-stream-key-del-panel-admin]`

3. **Ir a Configuración → Output**
   
   **Streaming:**
   - Output Mode: `Advanced`
   - Encoder: `x264` (o `NVENC` si tienes GPU NVIDIA)
   - Rate Control: `CBR`
   - Bitrate: `5000 Kbps` (para 1080p)
   - Keyframe Interval: `2`
   - Preset: `veryfast`
   - Profile: `high`
   - Tune: `zerolatency`

4. **Ir a Configuración → Video**
   - Base Resolution: `1920x1080`
   - Output Resolution: `1920x1080`
   - FPS: `30` o `60`

5. **Ir a Configuración → Audio**
   - Sample Rate: `44.1 kHz`
   - Channels: `Stereo`

### Configuración Recomendada por Calidad

#### 1080p (Full HD) - Mejor calidad
```
Bitrate: 5000 Kbps
Resolution: 1920x1080
FPS: 30
Encoder: x264 o NVENC
Preset: veryfast
```

#### 720p (HD) - Balance calidad/ancho de banda
```
Bitrate: 2800 Kbps
Resolution: 1280x720
FPS: 30
Encoder: x264
Preset: veryfast
```

#### 480p (SD) - Menor ancho de banda
```
Bitrate: 1400 Kbps
Resolution: 854x480
FPS: 30
Encoder: x264
Preset: veryfast
```

### Agregar Fuentes

1. **Cámara:**
   - Click en `+` en Sources
   - Seleccionar `Video Capture Device`
   - Elegir tu cámara

2. **Pantalla:**
   - Click en `+` en Sources
   - Seleccionar `Display Capture`
   - Elegir tu pantalla

3. **Audio:**
   - Click en `+` en Sources
   - Seleccionar `Audio Input Capture`
   - Elegir tu micrófono

### Iniciar Transmisión

1. Click en `Start Streaming`
2. Verifica en el panel admin que el stream está activo
3. Los espectadores podrán ver el stream en la web/app

---

## 🎛️ vMix (Profesional)

### Configuración

1. **Abrir vMix**

2. **Ir a Settings → Outputs**

3. **Configurar Stream:**
   - Destination: `Custom RTMP Server`
   - URL: `rtmp://tu-servidor.com/live`
   - Stream Key: `[tu-stream-key]`
   - Quality: `1080p60` o según preferencia
   - Bitrate: `5000 Kbps`

4. **Click en `Stream`** para iniciar

---

## 📱 Streaming desde Móvil

### Larix Broadcaster (iOS/Android)

1. **Descargar Larix Broadcaster**
   - iOS: App Store
   - Android: Google Play

2. **Configurar:**
   - Abrir app
   - Ir a Settings → Connections
   - Agregar nueva conexión:
     - Name: `PPV Streaming`
     - URL: `rtmp://tu-servidor.com/live/[tu-stream-key]`

3. **Iniciar transmisión:**
   - Volver a pantalla principal
   - Click en botón rojo para transmitir

---

## 🔧 Solución de Problemas

### El stream no se conecta

1. **Verificar URL y Stream Key**
   - Asegúrate de que la URL sea correcta
   - Verifica que el stream key sea válido

2. **Verificar firewall**
   - Puerto 1935 debe estar abierto
   - Permitir conexiones salientes RTMP

3. **Verificar servidor**
   - El servidor debe estar corriendo
   - Nginx-RTMP debe estar activo

### El stream se ve pixelado

1. **Aumentar bitrate**
   - 1080p: mínimo 5000 Kbps
   - 720p: mínimo 2800 Kbps

2. **Mejorar preset del encoder**
   - Cambiar de `veryfast` a `faster` o `fast`
   - Requiere más CPU

3. **Verificar conexión a internet**
   - Upload speed debe ser mayor al bitrate
   - Usar conexión por cable (no WiFi)

### El stream tiene lag/buffering

1. **Reducir bitrate**
   - Bajar a 720p o 480p
   - Reducir FPS a 30

2. **Verificar CPU**
   - Cerrar otros programas
   - Usar encoder de hardware (NVENC, QuickSync)

3. **Optimizar OBS**
   - Process Priority: `High`
   - Renderer: `Direct3D 11`

---

## 📊 Monitoreo del Stream

### En OBS Studio

- **Indicador verde**: Stream funcionando correctamente
- **Indicador amarillo**: Problemas de conexión
- **Indicador rojo**: Stream desconectado

### Estadísticas importantes

- **FPS**: Debe mantenerse estable (30 o 60)
- **Dropped Frames**: Debe ser < 1%
- **Bitrate**: Debe ser constante

---

## ✅ Checklist Pre-Transmisión

- [ ] Stream key obtenido del panel admin
- [ ] OBS configurado con URL y stream key correctos
- [ ] Bitrate y resolución configurados
- [ ] Fuentes de video/audio agregadas
- [ ] Test de audio (niveles correctos)
- [ ] Test de video (encuadre correcto)
- [ ] Conexión a internet estable (mínimo 10 Mbps upload)
- [ ] Stream de prueba realizado
- [ ] Panel admin muestra stream activo

---

## 🎯 Mejores Prácticas

1. **Siempre hacer pruebas antes del evento**
   - Transmitir 10-15 minutos antes
   - Verificar audio y video

2. **Tener backup de internet**
   - Conexión por cable principal
   - Hotspot móvil como respaldo

3. **Monitorear durante transmisión**
   - Revisar estadísticas cada 5-10 minutos
   - Tener chat/soporte disponible

4. **Iluminación y audio**
   - Buena iluminación es crucial
   - Audio claro es más importante que video HD

5. **Equipo de respaldo**
   - Segunda cámara
   - Segundo micrófono
   - Segundo encoder si es posible

---

## 📞 Soporte

Si tienes problemas durante la transmisión:

1. Verificar logs en OBS
2. Revisar panel administrativo
3. Contactar soporte técnico

**¡Buena transmisión! 🎉**
