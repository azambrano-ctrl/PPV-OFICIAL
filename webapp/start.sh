#!/bin/sh
# Configuración para arrancar la app en Render con memoria optimizada
# En modo 'standalone', Next.js no copia automáticamente la carpeta 'public' ni '.next/static'
# Esto hace que se vean 404s en CSS e imágenes. Lo copiamos aquí antes de arrancar.

echo "Preparando archivos estáticos para modo standalone..."
cp -r public .next/standalone/ || true
cp -r .next/static .next/standalone/.next/ || true

echo "Iniciando servidor Node..."
node .next/standalone/server.js
