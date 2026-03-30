'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, ZoomIn, ZoomOut, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
// Define Area locally to avoid import issues if type definitions vary
interface Area {
    width: number;
    height: number;
    x: number;
    y: number;
}

interface ImageUploadProps {
    label: string;
    value?: string;
    onChange: (file: File | null, previewUrl: string | null) => void;
    accept?: string;
    maxSize?: number; // in MB
    aspect?: number; // 0 for free form
}

export default function ImageUpload({
    label,
    value,
    onChange,
    accept = 'image/*',
    maxSize = 50,
    aspect = 16 / 9,
    compact = false,
}: ImageUploadProps & { compact?: boolean }) {
    const [preview, setPreview] = useState<string | null>(value || null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ... (rest of the state)

    // ... (existing helper functions)

    // ... handleFile, saveCrop, etc.

    // ... render logic

    // In the return TSX, update the dropzone container:
    // This is getting complicated to patch with just a chunk because the component is large and I need to touch multiple places (props, render).
    // Let's just replace the component definition start and the render part.


    // Crop state
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [originalFile, setOriginalFile] = useState<File | null>(null);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area,
        fileName: string
    ): Promise<File | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return null;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        const mimeType = originalFile?.type || 'image/png';
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Canvas is empty');
                    resolve(null);
                    return;
                }
                const file = new File([blob], fileName, { type: mimeType });
                resolve(file);
            }, mimeType);
        });
    };

    const handleFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida');
            return;
        }

        // Validate file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSize) {
            toast.error(`La imagen debe ser menor a ${maxSize}MB`);
            return;
        }

        // Read for crop
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageSrc(reader.result as string);
            setOriginalFile(file);
            setShowCropModal(true);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
    };

    const saveCrop = async () => {
        if (!imageSrc || !croppedAreaPixels || !originalFile) return;

        try {
            const croppedFile = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                originalFile.name
            );

            if (croppedFile) {
                const previewUrl = URL.createObjectURL(croppedFile);
                setPreview(previewUrl);
                onChange(croppedFile, previewUrl);
                setShowCropModal(false);
                setImageSrc(null);
            }
        } catch (e) {
            console.error(e);
            toast.error('Error al recortar la imagen');
        }
    };

    const cancelCrop = () => {
        setShowCropModal(false);
        setImageSrc(null);
        setOriginalFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onChange(null, null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                {label}
            </label>

            {preview ? (
                <div
                    className="relative group rounded-lg"
                    style={{
                        backgroundImage: 'conic-gradient(#f3f4f6 90deg, #e5e7eb 90deg 180deg, #f3f4f6 180deg 270deg, #e5e7eb 270deg)',
                        backgroundSize: '20px 20px'
                    }}
                >
                    <img
                        src={preview}
                        alt="Preview"
                        className={`w-full ${compact ? 'h-full aspect-square' : 'h-48'} object-contain rounded-lg`}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${compact ? 'p-4 h-full aspect-square' : 'p-8'} ${isDragging
                        ? 'border-red-600 bg-red-600/10'
                        : 'border-dark-700 hover:border-dark-600 bg-dark-800/50'
                        }`}
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className={`rounded-full flex items-center justify-center ${compact ? 'w-8 h-8 bg-dark-700/50' : 'w-12 h-12 bg-dark-700'}`}>
                            {isDragging ? (
                                <Upload className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-red-500 animate-bounce`} />
                            ) : (
                                <ImageIcon className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-gray-500`} />
                            )}
                        </div>
                        <div>
                            <p className={`text-white font-medium ${compact ? 'text-xs' : 'mb-1'}`}>
                                {compact ? (isDragging ? 'Soltar' : 'Subir Imagen') : (isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic')}
                            </p>
                            {!compact && (
                                <p className="text-sm text-gray-500">
                                    Recorta y ajusta tu imagen antes de subirla
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Crop Modal */}
            {showCropModal && imageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-dark-900 rounded-xl overflow-hidden max-w-5xl w-full max-h-[95vh] flex flex-col border border-dark-700">
                        <div className="p-4 border-b border-dark-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Ajustar Imagen</h3>
                            <button onClick={cancelCrop} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="relative h-[400px] md:h-[600px] w-full bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect === 0 ? undefined : aspect}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                showGrid={true}
                                minZoom={1}
                                maxZoom={10}
                            />
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                                    <ZoomOut className="w-5 h-5 text-gray-400" />
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={10}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                                    />
                                    <ZoomIn className="w-5 h-5 text-gray-400" />
                                    <span className="text-xs font-mono text-gray-400 w-12 text-right">
                                        {zoom.toFixed(1)}x
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setZoom(1)}
                                        className="px-2 py-1 text-xs bg-dark-800 text-gray-400 hover:text-white rounded border border-dark-700 transition-colors"
                                    >
                                        1x
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setZoom(2)}
                                        className="px-2 py-1 text-xs bg-dark-800 text-gray-400 hover:text-white rounded border border-dark-700 transition-colors"
                                    >
                                        2x
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setZoom(5)}
                                        className="px-2 py-1 text-xs bg-dark-800 text-gray-400 hover:text-white rounded border border-dark-700 transition-colors"
                                    >
                                        5x
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-dark-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400 mr-2">Proporción:</span>
                                    {/* Since aspect is passed as a prop, we can't easily change it locally without state, 
                                        but for now we'll respect the prop's aspect or dynamic if we added state.
                                        For this specific request, we'll keep it simple but improved.
                                    */}
                                    <span className="text-sm font-medium text-white bg-dark-800 px-3 py-1 rounded-full border border-dark-700">
                                        {aspect === 16 / 9 ? '16:9 (HD)' : aspect === 1 ? '1:1 (Cuadrado)' : aspect === 4 / 3 ? '4:3' : 'Personalizado'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setZoom(1);
                                            setCrop({ x: 0, y: 0 });
                                        }}
                                        className="px-4 py-2 rounded-lg text-gray-300 hover:bg-dark-700 transition-colors text-sm"
                                    >
                                        Restablecer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelCrop}
                                        className="px-4 py-2 rounded-lg text-gray-300 hover:bg-dark-700 transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveCrop}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors font-bold shadow-lg shadow-red-600/20"
                                    >
                                        <Save className="w-4 h-4" />
                                        Guardar Recorte
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
