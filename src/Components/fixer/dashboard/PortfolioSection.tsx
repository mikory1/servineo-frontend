"use client"

import { useEffect, useState } from "react"
import { PillButton } from "../Pill-button"
import { Plus, Trash2, Image as ImageIcon, Video, X, CheckCircle, XCircle } from "lucide-react"
import { IPortfolioItem } from "@/types/fixer-profile"
import { Modal } from "@/Components/Modal"
import { useForm } from "react-hook-form"
import Image from "next/image"

type PortfolioFormValues = {
  type: "image" | "video"
  url?: string
  youtubeUrl?: string
}

interface PortfolioSectionProps {
  readOnly?: boolean
  fixerId?: string
}

const API_URL = "http://localhost:8000/api"

// 🔹 Soporta: https://www.youtube.com/watch?v=ID, https://youtu.be/ID, /embed/ID, etc.
function getYouTubeId(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined
  try {
    const url = new URL(rawUrl)

    // youtu.be/ID
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "")
    }

    // youtube.com/watch?v=ID
    const vParam = url.searchParams.get("v")
    if (vParam) return vParam

    // youtube.com/embed/ID o rutas similares
    const parts = url.pathname.split("/")
    return parts[parts.length - 1] || undefined
  } catch {
    return undefined
  }
}

export function PortfolioSection({ readOnly = false, fixerId }: PortfolioSectionProps) {
  const [items, setItems] = useState<IPortfolioItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"image" | "video">("image")
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch } = useForm<PortfolioFormValues>()

  const effectiveFixerId = fixerId || "64a1b2c3d4e5f67890123456"
  const watchedUrl = watch("url")

  // Validar URL de imagen en tiempo real - Acepta cualquier tipo de URL
  useEffect(() => {
    if (!watchedUrl || modalType !== "image") {
      setPreviewUrl("")
      setIsValidUrl(null)
      return
    }

    const timeoutId = setTimeout(() => {
      setIsValidating(true)
      const img = document.createElement("img")
      
      img.onload = () => {
        setIsValidUrl(true)
        setPreviewUrl(watchedUrl)
        setIsValidating(false)
      }
      
      img.onerror = () => {
        setIsValidUrl(false)
        setPreviewUrl("")
        setIsValidating(false)
      }
      
      img.src = watchedUrl
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [watchedUrl, modalType])

  // Cargar portafolio
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_URL}/portfolio/fixer/${effectiveFixerId}`)
        if (!res.ok) {
          console.error("Error al obtener portafolio:", res.status)
          return
        }
        const data = await res.json()
        setItems(data)
      } catch (error) {
        console.error("Error obteniendo portafolio:", error)
      } finally {
        setLoading(false)
      }
    }

    if (effectiveFixerId) fetchPortfolio()
  }, [effectiveFixerId])

  const handleOpenModal = (type: "image" | "video") => {
    if (readOnly) return
    setModalType(type)
    setPreviewUrl("")
    setIsValidUrl(null)
    reset({
      type,
      url: "",
      youtubeUrl: "",
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setPreviewUrl("")
    setIsValidUrl(null)
    reset()
  }

  const onSubmit = async (data: PortfolioFormValues) => {
    try {
      let url = data.url

      // Validar que haya URL y que haya cargado correctamente
      if (data.type === "image") {
        if (!url) {
          alert("Por favor ingresa una URL")
          return
        }
        if (isValidUrl !== true) {
          alert("La imagen no pudo cargarse. Verifica la URL.")
          return
        }
      }

      if (data.type === "video" && data.youtubeUrl && !url) {
        const videoId = getYouTubeId(data.youtubeUrl)
        if (videoId) {
          url = `https://img.youtube.com/vi/${videoId}/0.jpg`
        }
      }

      const body = {
        type: data.type,
        url,
        youtubeUrl: data.youtubeUrl,
        fixerId: effectiveFixerId,
      }

      const res = await fetch(`${API_URL}/portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        console.error("Error creando item:", res.status)
        alert("Error al guardar la imagen. Intenta de nuevo.")
        return
      }

      const newItem = await res.json()
      setItems(prev => [...prev, newItem])
      handleCloseModal()
    } catch (error) {
      console.error("Error creando item de portafolio:", error)
      alert("Error al guardar. Verifica la URL e intenta de nuevo.")
    }
  }

  const handleDelete = async (id: string) => {
    if (readOnly) return
    const ok = confirm("¿Estás seguro de eliminar este elemento?")
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/portfolio/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        console.error("Error eliminando item:", res.status)
        return
      }

      setItems(prev => prev.filter(i => i._id !== id))
    } catch (error) {
      console.error("Error eliminando item del portafolio:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          {readOnly ? "Portafolio" : "Mi Portafolio"}
        </h2>

        {!readOnly && (
          <div className="flex gap-2">
            <PillButton
              onClick={() => handleOpenModal("video")}
              className="bg-primary text-white hover:bg-blue-800 flex items-center gap-2"
            >
              <Video className="h-4 w-4" />
              Video
            </PillButton>

            <PillButton
              onClick={() => handleOpenModal("image")}
              className="bg-primary text-white hover:bg-blue-800 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Imagen
            </PillButton>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando portafolio...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const isVideo = item.type === "video"
            const videoId = getYouTubeId(item.youtubeUrl || undefined)
            const hasUrl = item.url && item.url.trim() !== ""
            const isDataUrl = hasUrl && item.url.startsWith('data:')
            const isHttpUrl = hasUrl && (item.url.startsWith('http://') || item.url.startsWith('https://'))

            return (
              <div
                key={item._id}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                onClick={() => !isVideo && hasUrl && setFullscreenImage(item.url || null)}
              >
                {isVideo && videoId ? (
                  // 🔥 Video embebido de YouTube
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-2xl"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : hasUrl ? (
                  // 🖼 Imagen - usar img nativo para data URLs, next/image para URLs HTTP
                  <div className="absolute inset-0">
                    {isDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt="Portfolio item"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : isHttpUrl ? (
                      <Image
                        src={item.url}
                        alt="Portfolio item"
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized={!isHttpUrl}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt="Portfolio item"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                  </div>
                ) : (
                  // ⚠️ Sin imagen
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center p-4">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-medium">Sin imagen</p>
                    </div>
                  </div>
                )}

                {!readOnly && (
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none"
                  >
                    <button
                      onClick={() => handleDelete(item._id!)}
                      className="self-end p-2 bg-white/90 text-red-600 rounded-full hover:bg-white transition-colors shadow-sm hover:scale-110 pointer-events-auto"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={modalType === "image" ? "Agregar Imagen" : "Agregar Video"}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" value={modalType} {...register("type")} />

          {modalType === "image" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la Imagen
                </label>
                <div className="relative">
                  <input
                    {...register("url", { required: "La URL es requerida" })}
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  {isValidating && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!isValidating && isValidUrl === true && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                  )}
                  {!isValidating && isValidUrl === false && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-600" />
                  )}
                </div>
                {isValidUrl === false && (
                  <p className="text-xs text-red-600 mt-1">
                    ❌ No se pudo cargar la imagen. Verifica la URL.
                  </p>
                )}
                {isValidUrl === true && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✅ Imagen válida y lista para agregar
                  </p>
                )}
              </div>

              {/* Vista previa */}
              {previewUrl && isValidUrl && (
                <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
                  <p className="text-xs text-green-700 mb-2 font-semibold">✅ Vista Previa:</p>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-white shadow-md">
                    {previewUrl.startsWith('data:') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                        unoptimized={!previewUrl.startsWith('http')}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de YouTube
                </label>
                <input
                  {...register("youtubeUrl", { required: "La URL es requerida" })}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de Miniatura (Opcional)
                </label>
                <input
                  {...register("url")}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Se intentará extraer automáticamente"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <PillButton
              type="button"
              onClick={handleCloseModal}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </PillButton>

            <PillButton
              type="submit"
              className="bg-primary text-white hover:bg-blue-800"
              disabled={modalType === "image" && isValidUrl !== true}
            >
              Guardar
            </PillButton>
          </div>
        </form>
      </Modal>

      {/* Modal de imagen en pantalla completa */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative w-full h-full max-w-6xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {fullscreenImage.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fullscreenImage}
                alt="Imagen en pantalla completa"
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src={fullscreenImage}
                alt="Imagen en pantalla completa"
                fill
                className="object-contain"
                unoptimized={!fullscreenImage.startsWith('http')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
