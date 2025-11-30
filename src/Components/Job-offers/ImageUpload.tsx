"use client"

import { useState } from "react"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
}

export default function ImageUpload({ value = [], onChange, maxFiles = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    if (value.length + files.length > maxFiles) {
      setError(`Máximo ${maxFiles} imágenes permitidas`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      console.log('📤 Enviando imágenes al backend...');
      console.log('📁 Total de archivos:', files.length);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('🌐 Backend URL:', `${backendUrl}/api/upload/bulk-upload`);

      const response = await fetch(`${backendUrl}/api/upload/bulk-upload`, {
        method: 'POST',
        body: formData,
      })

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const data = await response.json()
        console.error('❌ Error del backend:', data);
        throw new Error(data.error || 'Error al subir imágenes')
      }

      const data = await response.json()
      console.log('✅ Respuesta del backend:', data);

      onChange([...value, ...data.urls])
      console.log('🎉 Imágenes subidas exitosamente');
    } catch (err) {
      console.error('💥 Error en handleFileChange:', err);
      setError(err instanceof Error ? err.message : 'Error al subir imágenes')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      {/* Zona de upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileChange}
          disabled={uploading || value.length >= maxFiles}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer inline-flex flex-col items-center ${
            value.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Subiendo imágenes...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                <span className="text-blue-600 font-medium">Haz clic para subir</span> o arrastra imágenes
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP (máx. {maxFiles} imágenes)
              </p>
            </>
          )}
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Preview de imágenes */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover rounded-lg"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      <p className="text-xs text-gray-500 text-center">
        {value.length} de {maxFiles} imágenes subidas
      </p>
    </div>
  )
}
