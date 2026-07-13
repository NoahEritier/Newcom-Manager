import { Linking } from 'react-native';

// Sin WhatsApp Business API: abre WhatsApp con un mensaje pre-cargado que el
// coach elige a quién/qué grupo mandarle (wa.me sin número = selector de chat).
export async function openWhatsAppMessage(message: string): Promise<void> {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}
