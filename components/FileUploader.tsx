
import React, { useState, useRef } from 'react';
import { Upload, FileText, ImageIcon, FileVideo, Music, Archive, AlertCircle } from 'lucide-react';
import { FileCategory, FileMetadata } from '../types';

interface FileUploaderProps {
  onFileSelect: (file: File, metadata: FileMetadata) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileCategory = (type: string): FileCategory => {
    if (type.startsWith('image/')) return FileCategory.IMAGE;
    if (type.startsWith('video/')) return FileCategory.VIDEO;
    if (type.startsWith('audio/')) return FileCategory.AUDIO;
    if (type === 'application/pdf') return FileCategory.PDF;
    if (type.includes('zip') || type.includes('tar') || type.includes('rar')) return FileCategory.ARCHIVE;
    if (type.startsWith('text/') || type.includes('word') || type.includes('document')) return FileCategory.TEXT;
    return FileCategory.UNKNOWN;
  };

  const handleFile = (file: File) => {
    const category = getFileCategory(file.type);
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      category,
      previewUrl: category === FileCategory.IMAGE ? URL.createObjectURL(file) : undefined
    };
    onFileSelect(file, metadata);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center space-y-4 ${
        isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/50'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      
      <div className="bg-slate-800 p-4 rounded-full group-hover:scale-110 transition-transform duration-300 text-blue-400">
        <Upload size={32} />
      </div>

      <div className="text-center">
        <p className="text-xl font-semibold text-slate-200">Drag & Drop File</p>
        <p className="text-sm text-slate-400 mt-1">Images, PDF, Video, Audio up to 500MB</p>
      </div>

      <div className="flex space-x-3 opacity-60">
        <ImageIcon size={18} />
        <FileText size={18} />
        <FileVideo size={18} />
        <Music size={18} />
        <Archive size={18} />
      </div>

      {isDragging && (
        <div className="absolute inset-0 pointer-events-none border-4 border-blue-500 rounded-2xl animate-pulse" />
      )}
    </div>
  );
};

export default FileUploader;
