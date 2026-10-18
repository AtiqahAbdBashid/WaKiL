/**
 * Compresses and resizes an uploaded image file before sending to Gemini API / database.
 * Reduces token consumption and avoids 429 RESOURCE_EXHAUSTED errors.
 *
 * @param {File} file - The uploaded image file.
 * @param {number} maxWidth - Maximum width (default 1024).
 * @param {number} maxHeight - Maximum height (default 1024).
 * @param {number} quality - JPEG compression quality between 0 and 1 (default 0.8).
 * @returns {Promise<string>} Base64 data URI of the compressed JPEG image.
 */
export function compressImageFile(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('File is not an image.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to decode image.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const compressedDataUri = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUri)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  })
}

