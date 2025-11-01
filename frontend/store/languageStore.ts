import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'tr' | 'es';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  
  setLanguage: async (lang: Language) => {
    try {
      await AsyncStorage.setItem('language', lang);
      set({ language: lang });
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
  
  loadLanguage: async () => {
    try {
      const savedLang = await AsyncStorage.getItem('language');
      if (savedLang) {
        set({ language: savedLang as Language });
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  },
}));

// Translation strings
export const translations = {
  en: {
    // Auth
    login: 'Login',
    register: 'Sign Up',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    fullName: 'Full Name',
    forgotPassword: 'Forgot Password?',
    dontHaveAccount: "Don't have an account? Sign up",
    alreadyHaveAccount: 'Already have an account? Sign in',
    aboutApp: 'About Drivers Chat',
    
    // Tabs
    home: 'Home',
    messages: 'Messages',
    friends: 'Friends',
    profile: 'Profile',
    
    // Common
    post: 'Post',
    send: 'Send',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    signOut: 'Sign Out',
    
    // Posts
    createPost: 'Create Post',
    whatsOnYourMind: "What's on your mind?",
    
    // Profile
    viewMyProfile: 'View My Profile',
    referralCode: 'Referral Code',
  },
  tr: {
    // Auth
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    email: 'E-posta',
    password: 'Şifre',
    username: 'Kullanıcı Adı',
    fullName: 'Ad Soyad',
    forgotPassword: 'Şifremi Unuttum?',
    dontHaveAccount: 'Hesabınız yok mu? Kayıt olun',
    alreadyHaveAccount: 'Zaten hesabınız var mı? Giriş yapın',
    aboutApp: 'Drivers Chat Hakkında',
    
    // Tabs
    home: 'Ana Sayfa',
    messages: 'Mesajlar',
    friends: 'Arkadaşlar',
    profile: 'Profil',
    
    // Common
    post: 'Paylaş',
    send: 'Gönder',
    cancel: 'İptal',
    save: 'Kaydet',
    delete: 'Sil',
    edit: 'Düzenle',
    settings: 'Ayarlar',
    help: 'Yardım',
    about: 'Hakkında',
    signOut: 'Çıkış Yap',
    
    // Posts
    createPost: 'Gönderi Oluştur',
    whatsOnYourMind: 'Ne düşünüyorsun?',
    
    // Profile
    viewMyProfile: 'Profilimi Görüntüle',
    referralCode: 'Referans Kodu',
  },
  es: {
    // Auth
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    username: 'Nombre de Usuario',
    fullName: 'Nombre Completo',
    forgotPassword: '¿Olvidaste tu contraseña?',
    dontHaveAccount: '¿No tienes cuenta? Regístrate',
    alreadyHaveAccount: '¿Ya tienes cuenta? Inicia sesión',
    aboutApp: 'Acerca de Drivers Chat',
    
    // Tabs
    home: 'Inicio',
    messages: 'Mensajes',
    friends: 'Amigos',
    profile: 'Perfil',
    
    // Common
    post: 'Publicar',
    send: 'Enviar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    settings: 'Configuración',
    help: 'Ayuda',
    about: 'Acerca de',
    signOut: 'Cerrar Sesión',
    
    // Posts
    createPost: 'Crear Publicación',
    whatsOnYourMind: '¿Qué estás pensando?',
    
    // Profile
    viewMyProfile: 'Ver Mi Perfil',
    referralCode: 'Código de Referencia',
  },
};

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  
  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  };
  
  return { t, language };
};
