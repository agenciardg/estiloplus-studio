import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Loader2, Camera, Check, X, Coins, AlertTriangle } from "lucide-react";

const PROFILE_PHOTO_COST = 5;

interface ProfileUploadProps {
  onUploadSuccess?: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ProfileUpload({ onUploadSuccess }: ProfileUploadProps) {
  const { user, updateProfilePhoto } = useAuth();
  const { toast } = useToast();
  const hasEnoughCredits = (user?.credits ?? 0) >= PROFILE_PHOTO_COST;
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowCropDialog(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 3 / 4));
  }

  async function handleCropComplete() {
    if (!imgRef.current || !crop || !imageFile || !user) return;

    setIsUploading(true);

    try {
      const canvas = document.createElement("canvas");
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      // Converter crop de porcentagem para pixels se necessário
      let cropX = crop.x;
      let cropY = crop.y;
      let cropWidth = crop.width;
      let cropHeight = crop.height;
      
      if (crop.unit === '%') {
        cropX = (crop.x / 100) * image.width;
        cropY = (crop.y / 100) * image.height;
        cropWidth = (crop.width / 100) * image.width;
        cropHeight = (crop.height / 100) * image.height;
      }
      
      const pixelCropX = Math.round(cropX * scaleX);
      const pixelCropY = Math.round(cropY * scaleY);
      const pixelCropWidth = Math.round(cropWidth * scaleX);
      const pixelCropHeight = Math.round(cropHeight * scaleY);
      
      console.log('Crop details:', { 
        crop, 
        imageSize: { width: image.width, height: image.height },
        naturalSize: { width: image.naturalWidth, height: image.naturalHeight },
        pixelCrop: { x: pixelCropX, y: pixelCropY, width: pixelCropWidth, height: pixelCropHeight }
      });
      
      canvas.width = pixelCropWidth;
      canvas.height = pixelCropHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error('Não foi possível criar contexto do canvas');
      }

      ctx.drawImage(
        image,
        pixelCropX,
        pixelCropY,
        pixelCropWidth,
        pixelCropHeight,
        0,
        0,
        pixelCropWidth,
        pixelCropHeight
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) {
            console.log('Blob created, size:', b.size);
            resolve(b);
          } else {
            reject(new Error('Falha ao criar blob da imagem'));
          }
        }, "image/jpeg", 0.9);
      });

      const file = new File([blob], `profile-${user.id}.jpg`, { type: "image/jpeg" });
      const path = `profiles/${user.id}/${Date.now()}.jpg`;
      
      console.log('Starting upload for path:', path);
      const imageUrl = await uploadImage(file, "images", path);
      console.log('Received image URL:', imageUrl);

      if (imageUrl) {
        const { error } = await updateProfilePhoto(imageUrl, PROFILE_PHOTO_COST);
        
        if (error) {
          throw new Error(error);
        }
        
        toast({
          title: "Foto atualizada!",
          description: "Sua foto de perfil foi salva com sucesso.",
        });
        onUploadSuccess?.();
      } else {
        throw new Error('URL da imagem não foi retornada');
      }
    } catch (error: any) {
      console.error('Profile upload error:', error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível salvar a foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setShowCropDialog(false);
      setPreviewUrl(null);
      setImageFile(null);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Avatar className="h-32 w-32">
          <AvatarImage src={user?.profileImageUrl} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {user?.name ? getInitials(user.name) : "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold mb-1">{user?.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
          <p className="text-sm text-muted-foreground">
            Envie uma foto de corpo inteiro para usar no provador virtual.
            A imagem será recortada automaticamente.
          </p>
        </div>
      </div>

      <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          data-testid="dropzone-profile"
        >
          <input {...getInputProps()} data-testid="input-profile-image" />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {isDragActive ? "Solte a imagem aqui" : "Arraste uma foto ou clique para selecionar"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG ou WebP até 10MB
              </p>
            </div>
          </div>
        </div>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Ajustar Foto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  aspect={3 / 4}
                  className="max-h-[60vh]"
                >
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="Preview"
                    onLoad={onImageLoad}
                    className="max-h-[60vh] object-contain"
                  />
                </ReactCrop>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCropDialog(false);
                  setPreviewUrl(null);
                }}
                disabled={isUploading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleCropComplete} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvar Foto
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
