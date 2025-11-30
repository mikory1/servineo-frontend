import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron archivos' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Máximo 5 archivos permitidos' },
        { status: 400 }
      );
    }

    // Validar que sean imágenes
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo de archivo no permitido: ${file.type}` },
          { status: 400 }
        );
      }
    }

    // Enviar archivos al backend
    const backendFormData = new FormData();
    files.forEach((file) => {
      backendFormData.append('files', file);
    });

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/upload/bulk-upload`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al subir archivos');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      urls: data.urls,
      message: data.message,
    });
  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir archivos' },
      { status: 500 }
    );
  }
}
