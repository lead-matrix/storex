import imageCompression from 'browser-image-compression';

export async function optimizeImage(file: File) {
    const options = {
        maxSizeMB: 0.5, // Target size 500KB
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: 0.8,
        fileType: 'image/webp' // Convert to WebP for maximum performance
    };

    try {
        const compressedFile = await imageCompression(file, options);
        // Rename to .webp if it was converted
        const name = file.name.split('.')[0] + '.webp';
        return new File([compressedFile], name, { type: 'image/webp' });
    } catch (error) {
        console.error("Image optimization failed:", error);
        return file; // Fallback to original
    }
}
