import { Linking } from 'react-native';

// Sin WhatsApp Business API: abre WhatsApp con un mensaje pre-cargado que el
// coach elige a quién/qué grupo mandarle (wa.me sin número = selector de chat).
export async function openWhatsAppMessage(message: string): Promise<void> {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}

// Contacto individual: manda directo al número (sin espacios/símbolos) del jugador.
export async function openWhatsAppToNumber(phone: string, message: string): Promise<void> {
  const digitsOnly = phone.replace(/[^\d]/g, '');
  const url = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}
