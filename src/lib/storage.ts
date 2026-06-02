import { supabase } from "./supabase";

const COMPANY_MEDIA_BUCKET = "company-logos";

type CompanyImageType = "logo" | "cover";

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension) {
    return "png";
  }

  return extension;
}

async function uploadCompanyImage(
  companyId: string,
  file: File,
  type: CompanyImageType
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie apenas arquivos de imagem.");
  }

  const maxSizeInBytes = type === "cover" ? 4 * 1024 * 1024 : 2 * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    throw new Error(
      type === "cover"
        ? "A imagem de capa precisa ter no máximo 4MB."
        : "A foto precisa ter no máximo 2MB."
    );
  }

  const extension = getFileExtension(file);
  const filePath = `${companyId}/${type}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(COMPANY_MEDIA_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(COMPANY_MEDIA_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadCompanyLogo(companyId: string, file: File) {
  return uploadCompanyImage(companyId, file, "logo");
}

export async function uploadCompanyCover(companyId: string, file: File) {
  return uploadCompanyImage(companyId, file, "cover");
}