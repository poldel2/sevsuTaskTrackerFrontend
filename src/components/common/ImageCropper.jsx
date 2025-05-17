import React, { useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Modal, Button, Space } from 'antd';
import { ScissorOutlined, CloseOutlined } from '@ant-design/icons';
import { centerAspectCrop, cropImage } from '../../services/imageService';

const ImageCropper = ({ file, aspect = 1, onCropComplete, onCancel }) => {
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [isModalOpen, setIsModalOpen] = useState(true);

    React.useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => 
                setImgSrc(reader.result?.toString() || ''),
            );
            reader.readAsDataURL(file);
        }
    }, [file]);

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
    };

    const handleComplete = async () => {
        if (!crop || !imgSrc) return;

        try {
            const croppedImage = await cropImage(imgSrc, crop);
            onCropComplete(croppedImage);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error cropping image:', err);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        onCancel?.();
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ScissorOutlined />
                    <span>Редактирование изображения</span>
                </div>
            }
            open={isModalOpen}
            onCancel={() => null}
            maskClosable={false}
            keyboard={false}
            closeIcon={null}
            centered
            width={800}
            footer={
                <Space size="middle">
                    <Button 
                        icon={<CloseOutlined />}
                        onClick={handleCancel}
                        size="large"
                    >
                        Отмена
                    </Button>
                    <Button 
                        type="primary" 
                        onClick={handleComplete}
                        icon={<ScissorOutlined />}
                        size="large"
                        style={{ backgroundColor: '#5C7BBB', borderColor: '#5C7BBB' }}
                    >
                        Применить
                    </Button>
                </Space>
            }
            styles={{
                mask: {
                    backdropFilter: 'blur(4px)',
                    background: 'rgba(0, 0, 0, 0.45)'
                },
                content: {
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    borderRadius: '12px',
                }
            }}
        >
            <div className="image-cropper-container">
                {imgSrc && (
                    <>
                        <div className="crop-area">
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                aspect={aspect}
                                className="cropper"
                                circularCrop
                            >
                                <img
                                    src={imgSrc}
                                    onLoad={onImageLoad}
                                    alt="Crop"
                                    style={{ maxWidth: '100%', maxHeight: '60vh' }}
                                />
                            </ReactCrop>
                        </div>
                        <div className="crop-info">
                            <p>Выберите область для логотипа проекта</p>
                            <p className="crop-hint">Рекомендуемый размер: 150x150 пикселей</p>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ImageCropper;