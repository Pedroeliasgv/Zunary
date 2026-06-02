import { supabase } from "./supabase";

const COMPANY_LOGOS_BUCKET = "company-logos";

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension) {
    return "png";
  }

  return extension;
}

export async function uploadCompanyLogo(companyId: string, file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie apenas arquivos de imagem.");
  }

  const maxSizeInBytes = 2 * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    throw new Error("A imagem precisa ter no máximo 2MB.");
  }

  const extension = getFileExtension(file);
  const filePath = `${companyId}/logo-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(COMPANY_LOGOS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(COMPANY_LOGOS_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}