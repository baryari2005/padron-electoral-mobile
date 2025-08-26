export function getAvatarUrl(nombre: string, profileImage?: string | null): string {
  if (profileImage) return profileImage;
  const bg = "adf5d7";
  const color = "000";
  const size = 128;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    nombre
  )}&background=${bg}&color=${color}&size=${size}&rounded=true&bold=true&format=png`;
}