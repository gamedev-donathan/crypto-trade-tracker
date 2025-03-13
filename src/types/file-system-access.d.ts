// Type definitions for the File System Access API
// These are not yet included in the standard TypeScript library

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  entries(): AsyncIterable<[string, FileSystemHandle]>;
  keys(): AsyncIterable<string>;
  values(): AsyncIterable<FileSystemHandle>;
}

type FileSystemHandle = FileSystemFileHandle | FileSystemDirectoryHandle;

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface StorageManager {
  getDirectory(): Promise<FileSystemDirectoryHandle>;
}

interface ShowDirectoryPickerOptions {
  id?: string;
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  mode?: 'read' | 'readwrite';
}

interface ShowSaveFilePickerOptions {
  suggestedName?: string;
  types?: {
    description?: string;
    accept: Record<string, string[]>;
  }[];
  excludeAcceptAllOption?: boolean;
  id?: string;
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

interface Window {
  showDirectoryPicker(options?: ShowDirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
  showSaveFilePicker(options?: ShowSaveFilePickerOptions): Promise<FileSystemFileHandle>;
}

interface Navigator {
  storage: StorageManager;
} 