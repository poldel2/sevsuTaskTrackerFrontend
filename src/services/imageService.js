import { centerCrop, makeAspectCrop } from 'react-image-crop';

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

export const centerAspectCrop = (mediaWidth, mediaHeight, aspect) => {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
};

export const cropImage = async (
    imageSrc,
    crop,
    targetWidth = 150,
    targetHeight = 150
) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Устанавливаем размеры выходного изображения
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
        image,
        (crop.x * image.naturalWidth) / 100,
        (crop.y * image.naturalHeight) / 100,
        (crop.width * image.naturalWidth) / 100,
        (crop.height * image.naturalHeight) / 100,
        0,
        0,
        targetWidth,
        targetHeight
    );

    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    console.error('Canvas is empty');
                    return;
                }
                resolve(blob);
            },
            'image/jpeg',
            0.95
        );
    });
};