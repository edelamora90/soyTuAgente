📦 ImageDropzoneComponent — README Oficial
Componente universal, reutilizable y totalmente autónomo para cargar y previsualizar imágenes en Angular.
Especialmente diseñado para una arquitectura modular como la de SoyTuAgente (eventos, blog, agentes, galerías, etc.).

Soporta:

✔ Imágenes únicas

✔ Múltiples imágenes

✔ Límite configurable (cantImage)

✔ Previews escalados proporcionalmente (máx. 180×180)

✔ Botón para eliminar imágenes

✔ Emisión de eventos al padre (archivos y previews)

✔ Auto–configuración sin código extra

✔ Reutilizable en cualquier módulo sin repetir lógica

🚀 Características principales
Auto–detecta si debe trabajar en modo single o multiple.

Interfaz visual limpia, moderna y minimalista.

Previsualización proporcional SIN recortes:

Si subes 2000×1000 → se muestra 180×90.

Si subes 1000×2000 → se muestra 90×180.

Si subes 512×512 → se muestra 180×180.

Siempre responde al padre:

fileUploaded

filesUploaded

fileRemoved

previewsChanged

🧩 Instalación
Coloca el componente en:

/src/app/shared/image-dropzone/
Archivos requeridos:

image-dropzone.component.ts
image-dropzone.component.html
image-dropzone.component.scss
Luego puedes importarlo en cualquier componente standalone:

imports: [ImageDropzoneComponent]
🎛️ Inputs disponibles
Input	Tipo	Descripción
cantImage	number	Cantidad máxima de imágenes permitidas. Si no se define → usa 1.
previewUrls	string[]	Previews iniciales (útil para modo edición).
📡 Outputs disponibles
Output	Devuelve	Descripción
fileUploaded	File	Se dispara cuando se sube UNA imagen (modo single).
filesUploaded	File[]	Se dispara cuando se agregan varias imágenes (modo multiple).
fileRemoved	number	Índice de la imagen removida.
previewsChanged	string[]	Arreglo de previews actualizado cada vez que cambian.
🌟 Modo automático (default = una sola imagen)
<app-image-dropzone></app-image-dropzone>
cantImage = 1

Modo single

Emite: fileUploaded, fileRemoved, previewsChanged

Texto mostrado:
"Selecciona una imagen para subir"

🌟 Modo explícito (1 imagen)
<app-image-dropzone cantImage="1"></app-image-dropzone>
Comportamiento idéntico al auto configurado.

🌄 Modo galería (2 o más imágenes)
Perfecto para:

Eventos (galería de fotos)

Blogs (assets del post)

Perfiles de agentes

Carruseles y sliders

<app-image-dropzone
  cantImage="3"
></app-image-dropzone>
✨ Esto activa automáticamente:

multiple = true

Previews en arreglo

Texto dinámico:
"Selecciona una o varias imágenes para subir"

Emisión automática de:

filesUploaded

previewsChanged

fileRemoved

🧠 Integración típica en un módulo (ejemplo real)
🌄 1️⃣ Imagen de portada (single)
<app-image-dropzone
  cantImage="1"
  [previewUrls]="coverPreview ? [coverPreview] : []"
  (fileUploaded)="onCoverUpload($event)"
  (fileRemoved)="onCoverRemove()"
  (previewsChanged)="coverPreview = $event[0] || null"
></app-image-dropzone>
TS:
onCoverUpload(file: File) {
  // Llamas a tu API de subida
}

onCoverRemove() {
  this.coverPreview = null;
}
🖼️ 2️⃣ Galería (multiple)
<app-image-dropzone
  cantImage="6"
  [previewUrls]="gallery"
  (filesUploaded)="onGalleryUpload($event)"
  (fileRemoved)="onGalleryRemove($event)"
  (previewsChanged)="gallery = $event"
></app-image-dropzone>
TS:
onGalleryUpload(files: File[]) {
  // Subes múltiples imágenes aquí
}

onGalleryRemove(index: number) {
  this.gallery.splice(index, 1);
}

🔥 BONUS — Funcionalidades internas del dropzone
Estas ya están implementadas dentro del componente, sin que el padre tenga que escribir nada.

✔ Auto–configuración por cantidad de imágenes
isMultiple = this.cantImage > 1;
✔ Previews escalados sin recortes
.preview-img {
  max-width: 180px;
  max-height: 180px;
  object-fit: contain;
}
✔ Botón “X” para eliminar imagen
Incluye:

Lógica para identificar index

Emite al padre quién fue eliminado

Actualiza previews internos y externos

✔ previewsChanged siempre sincroniza al padre
Esto te permite:

Mostrar previews en edición

Guardar temporalmente imágenes

Renderizar en tiempo real

🎉 Conclusión
Este módulo ahora es:

⭐ 100% reutilizable
⭐ 100% configurable
⭐ 100% aislado del resto del sistema
⭐ 0 lógica repetida en los módulos
⭐ Listo para futuros upgrades (drag & drop reorder, modal zoom, filtros, etc.)