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
}

export default function ImageUpload({
    label,
    value,
    onChange,
    accept = 'image/*',
    maxSize = 50,
}: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(value || null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Canvas is empty');
                    resolve(null);
                    return;
                }
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg');
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
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
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
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging
                        ? 'border-red-600 bg-red-600/10'
                        : 'border-dark-700 hover:border-dark-600 bg-dark-800/50'
                        }`}
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-dark-700 rounded-full flex items-center justify-center">
                            {isDragging ? (
                                <Upload className="w-6 h-6 text-red-500 animate-bounce" />
                            ) : (
                                <ImageIcon className="w-6 h-6 text-gray-500" />
                            )}
                        </div>
                        <div>
                            <p className="text-white font-medium mb-1">
                                {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                            </p>
                            <p className="text-sm text-gray-500">
                                Recorta y ajusta tu imagen antes de subirla
                            </p>
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
                    <div className="bg-dark-900 rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col border border-dark-700">
                        <div className="p-4 border-b border-dark-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Ajustar Imagen</h3>
                            <button onClick={cancelCrop} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="relative h-[400px] w-full bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={16 / 9} // Default aspect ratio, maybe make prop?
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <ZoomOut className="w-5 h-5 text-gray-400" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <ZoomIn className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={cancelCrop}
                                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-dark-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={saveCrop}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Guardar Recorte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
