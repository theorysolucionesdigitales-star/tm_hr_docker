import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg } from "@/lib/cropImage";

interface ImageCropperModalProps {
    open: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropSubmit: (croppedBlob: Blob) => void;
}

export function ImageCropperModal({ open, imageSrc, onClose, onCropSubmit }: ImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedBlob) {
                onCropSubmit(croppedBlob);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md w-full" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
                </DialogHeader>

                <div className="relative w-full h-80 bg-black rounded-md overflow-hidden my-4">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Zoom</label>
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(v) => setZoom(v[0])}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Aceptar Foto</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
