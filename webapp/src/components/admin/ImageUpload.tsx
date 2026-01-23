'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

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
    maxSize = 5,
}: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(value || null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const previewUrl = reader.result as string;
            setPreview(previewUrl);
            onChange(file, previewUrl);
        };
        reader.readAsDataURL(file);
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
                                PNG, JPG, GIF hasta {maxSize}MB
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
        </div>
    );
}
