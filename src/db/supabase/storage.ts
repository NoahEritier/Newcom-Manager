import { generateUuid } from '../../utils/uuid';
import { supabase } from './client';

// Sube una imagen a un bucket de Storage y devuelve su URL pública. Requiere
// conexión: no hay cola offline para imágenes (a diferencia de asistencia),
// así que cualquier error se propaga para que la pantalla lo muestre y el
// usuario reintente cuando tenga señal.
async function uploadImage(bucket: string, folderId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folderId}/${generateUuid()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPlayerPhoto(teamId: string, localUri: string): Promise<string> {
  return uploadImage('player-photos', teamId, localUri);
}

export async function uploadTournamentFlyer(teamId: string, localUri: string): Promise<string> {
  return uploadImage('tournament-flyers', teamId, localUri);
}

export async function uploadStatSheetImage(teamId: string, localUri: string): Promise<string> {
  return uploadImage('stat-sheets', teamId, localUri);
}
