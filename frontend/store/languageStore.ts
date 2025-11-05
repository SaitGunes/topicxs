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
    error: 'Error',
    success: 'Success',
    fillAllFields: 'Please fill in all fields',
    fillAllRequiredFields: 'Please fill in all required fields',
    selectLanguage: 'Select Language',
    passwordMinLength: 'Password must be at least 6 characters',
    passwordMinLengthPlaceholder: 'Password (min. 6 characters)',
    referralCodeOptional: 'Referral Code (optional)',
    creatingAccount: 'Creating account...',
    joinDriverCommunity: 'Join the driver community',
    
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
    loading: 'Loading...',
    
    // Posts
    createPost: 'Create Post',
    newPost: 'New Post',
    editPost: 'Edit Post',
    whatsOnYourMind: "What's on your mind?",
    publishing: 'Publishing...',
    addPhoto: 'Add Photo',
    noPostsYet: 'No posts yet',
    beFirstToPost: 'Be the first to post!',
    postPublished: 'Your post has been published',
    writeError: 'Please write something',
    failedCreatePost: 'Failed to create post',
    postUpdated: 'Post updated successfully',
    failedUpdatePost: 'Failed to update post',
    postDeleted: 'Post deleted successfully',
    failedDeletePost: 'Failed to delete post',
    postRemoved: 'This post was removed due to community feedback',
    
    // Privacy
    whoCanSee: 'Who can see this?',
    publicEveryone: 'Public - Everyone',
    friendsOnly: 'Friends - Only friends',
    specificFriends: 'Specific - Choose friends',
    noFriendsYet: 'No friends yet. Add friends to share with specific people.',
    
    // Delete confirmation
    deletePostTitle: 'Delete Post',
    deletePostMessage: 'Are you sure you want to delete your post?',
    deletePostAdminMessage: 'Are you sure you want to delete this post as an admin?',
    
    // Profile
    viewMyProfile: 'View My Profile',
    yourReferralCode: 'Your Referral Code',
    peopleJoined: 'people joined with your code',
    profilePictureUpdated: 'Profile picture updated successfully!',
    failedUpdatePicture: 'Failed to update profile picture',
    logoutError: 'Failed to sign out. Please try again.',
    
    // Settings
    accountSettings: 'Account Settings',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updatePassword: 'Update Password',
    deleteAccount: 'Delete Account',
    deleteAccountWarning: 'This action cannot be undone. All your data will be permanently deleted.',
    deleteAccountConfirm: 'Delete My Account',
    language: 'Language',
    passwordUpdated: 'Password updated successfully',
    passwordsDontMatch: 'Passwords do not match',
    accountDeleted: 'Account deleted successfully',
    
    // Help
    helpTitle: 'Help & FAQ',
    helpQuestion1: 'What is Drivers Chat?',
    helpAnswer1: 'Drivers Chat is a social platform designed specifically for Uber and Lyft drivers to connect, share experiences, and communicate with each other.',
    helpQuestion2: 'How do I create a post?',
    helpAnswer2: 'Tap the + button on the home screen. You can write text, add photos, and choose who can see your post (Public, Friends, or Specific friends).',
    helpQuestion3: 'What are likes and dislikes?',
    helpAnswer3: 'You can like (👍) or dislike (👎) posts and comments. If a post gets 10 or more dislikes and dislikes exceed likes, it will be automatically removed.',
    helpQuestion4: 'How do I add friends?',
    helpAnswer4: 'Go to the Friends tab, search for users, and send them a friend request. Once accepted, you can share posts with them.',
    helpQuestion5: 'What is a referral code?',
    helpAnswer5: 'Your unique referral code can be shared with other drivers. When they sign up using your code, you both benefit from being connected!',
    helpQuestion6: 'How do I change my profile picture?',
    helpAnswer6: 'Go to Profile tab and tap on your profile picture to upload a new photo.',
    helpQuestion7: 'How do I contact support?',
    helpAnswer7: 'For support, email us at support@drvchat.com',
    
    // About
    aboutTitle: 'About Drivers Chat',
    aboutDescription: 'Drivers Chat is a community platform built by drivers, for drivers. Connect with fellow Uber and Lyft drivers, share your experiences, and build meaningful connections.',
    aboutVersion: 'Version',
    aboutSupport: 'Support',
    aboutTerms: 'Terms & Conditions',
    viewTerms: 'View Terms & Conditions',
    
    // Terms Modal
    termsTitle: 'Terms & Conditions',
    termsOfService: 'Terms of Service',
    communityGuidelines: 'Community Guidelines',
    termsAccept: 'I Accept',
    termsDecline: 'Decline',
    termsStep: 'Step',
    termsOf: 'of',
    termsAgreeService: 'I have read and agree to the Terms of Service',
    termsAgreeGuidelines: 'I have read and agree to follow the Community Guidelines',
    termsContinue: 'Continue',
    termsAcceptStart: 'Accept & Start Using Drivers Chat',
    termsEffectiveDate: 'Effective Date: January 2025',
    termsWelcome: 'Welcome to Drivers Chat! Please read these terms carefully before using our application.',
    termsNonCommercial: 'Non-Commercial Application',
    termsLimitationLiability: 'Limitation of Liability',
    termsYourRights: 'Your Rights & Account Control',
    termsDataPrivacy: 'Data & Privacy',
    termsAgeRequirement: 'Age Requirement',
    termsAccountSecurity: 'Account Security',
    termsServiceChanges: 'Service Changes & Termination',
    termsContact: 'Contact',
    termsSupportEmail: 'support@drvchat.com',
    guidelinesKeepSafe: 'Keep Drivers Chat Safe & Respectful',
    guidelinesIntro: 'These guidelines ensure a positive experience for all members. Violations will result in account suspension or permanent ban.',
    guidelinesProhibited: 'Strictly Prohibited Content',
    guidelinesConsequences: 'Consequences',
    guidelinesWhatYouCan: 'What You CAN Share',
    guidelinesReport: 'Report Violations',
    
    // About page
    aboutWherDriversConnect: 'Where Drivers Connect',
    aboutTheApp: 'About the App',
    aboutAppDescription: 'Drivers Chat is a FREE social platform built exclusively for Uber and Lyft drivers. Connect with fellow drivers, share experiences, get tips, and stay informed about everything related to rideshare driving.',
    aboutOurMission: 'Our Mission',
    aboutMissionDescription: 'To create a supportive community where rideshare drivers can connect, share knowledge, and help each other navigate the challenges and opportunities of driving for Uber and Lyft.',
    aboutKeyFeatures: 'Key Features',
    aboutFeature1: 'Connect with drivers nationwide',
    aboutFeature2: 'Real-time messaging',
    aboutFeature3: 'Share tips and experiences',
    aboutFeature4: 'Community-driven content moderation',
    aboutFeature5: 'Referral rewards system',
    aboutFeature6: 'Safe and respectful community',
    aboutFree: '100% Free',
    aboutFreeDescription: 'Drivers Chat is completely free with no paid memberships, premium features, or hidden costs. This is a non-commercial platform built by drivers, for drivers.',
    aboutCommunityGuidelines: 'Community Guidelines',
    aboutGuidelinesDescription: 'We maintain a safe and respectful environment by prohibiting commercial activities, political content, gambling, adult content, hate speech, and illegal activities. Users who violate our guidelines face account suspension or permanent bans.',
    aboutReadFullTerms: 'Read Full Terms & Guidelines →',
    aboutContactSupport: 'Contact & Support',
    aboutContactDescription: 'Have questions, feedback, or need help?',
    aboutEmailUs: 'Email us at:',
    aboutVisitHelp: 'Visit Help Center →',
    aboutLegal: 'Legal',
    aboutTermsService: 'Terms of Service',
    aboutPrivacyPolicy: 'Privacy Policy',
    aboutMadeWith: 'Made with ❤️ for rideshare drivers',
    aboutCopyright: '© 2025 Drivers Chat. All rights reserved.',
    aboutLegalGuidelines: 'Legal & Guidelines',
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
    error: 'Hata',
    success: 'Başarılı',
    fillAllFields: 'Lütfen tüm alanları doldurun',
    fillAllRequiredFields: 'Lütfen tüm gerekli alanları doldurun',
    selectLanguage: 'Dil Seçin',
    passwordMinLength: 'Şifre en az 6 karakter olmalıdır',
    passwordMinLengthPlaceholder: 'Şifre (min. 6 karakter)',
    referralCodeOptional: 'Referans Kodu (isteğe bağlı)',
    creatingAccount: 'Hesap oluşturuluyor...',
    joinDriverCommunity: 'Sürücü topluluğuna katılın',
    
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
    loading: 'Yükleniyor...',
    
    // Posts
    createPost: 'Gönderi Oluştur',
    newPost: 'Yeni Gönderi',
    editPost: 'Gönderiyi Düzenle',
    whatsOnYourMind: 'Ne düşünüyorsun?',
    publishing: 'Yayınlanıyor...',
    addPhoto: 'Fotoğraf Ekle',
    noPostsYet: 'Henüz gönderi yok',
    beFirstToPost: 'İlk paylaşan sen ol!',
    postPublished: 'Gönderiniz yayınlandı',
    writeError: 'Lütfen bir şeyler yazın',
    failedCreatePost: 'Gönderi oluşturulamadı',
    postUpdated: 'Gönderi başarıyla güncellendi',
    failedUpdatePost: 'Gönderi güncellenemedi',
    postDeleted: 'Gönderi başarıyla silindi',
    failedDeletePost: 'Gönderi silinemedi',
    postRemoved: 'Bu gönderi topluluk geri bildirimi nedeniyle kaldırıldı',
    
    // Privacy
    whoCanSee: 'Bunu kimler görebilir?',
    publicEveryone: 'Herkese Açık',
    friendsOnly: 'Arkadaşlar - Sadece arkadaşlar',
    specificFriends: 'Belirli Kişiler - Arkadaşları seç',
    noFriendsYet: 'Henüz arkadaş yok. Belirli kişilerle paylaşmak için arkadaş ekleyin.',
    
    // Delete confirmation
    deletePostTitle: 'Gönderiyi Sil',
    deletePostMessage: 'Gönderinizi silmek istediğinizden emin misiniz?',
    deletePostAdminMessage: 'Yönetici olarak bu gönderiyi silmek istediğinizden emin misiniz?',
    
    // Profile
    viewMyProfile: 'Profilimi Görüntüle',
    yourReferralCode: 'Referans Kodunuz',
    peopleJoined: 'kişi kodunuzla katıldı',
    profilePictureUpdated: 'Profil resmi başarıyla güncellendi!',
    failedUpdatePicture: 'Profil resmi güncellenemedi',
    logoutError: 'Çıkış yapılamadı. Lütfen tekrar deneyin.',
    
    // Settings
    accountSettings: 'Hesap Ayarları',
    changePassword: 'Şifre Değiştir',
    currentPassword: 'Mevcut Şifre',
    newPassword: 'Yeni Şifre',
    confirmPassword: 'Şifreyi Onayla',
    updatePassword: 'Şifreyi Güncelle',
    deleteAccount: 'Hesabı Sil',
    deleteAccountWarning: 'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.',
    deleteAccountConfirm: 'Hesabımı Sil',
    language: 'Dil',
    passwordUpdated: 'Şifre başarıyla güncellendi',
    passwordsDontMatch: 'Şifreler eşleşmiyor',
    accountDeleted: 'Hesap başarıyla silindi',
    
    // Help
    helpTitle: 'Yardım & SSS',
    helpQuestion1: 'Drivers Chat nedir?',
    helpAnswer1: 'Drivers Chat, Uber ve Lyft sürücüleri için özel olarak tasarlanmış bir sosyal platformdur. Sürücüler birbirleriyle bağlantı kurabilir, deneyimlerini paylaşabilir ve iletişim kurabilir.',
    helpQuestion2: 'Nasıl gönderi oluştururum?',
    helpAnswer2: 'Ana ekrandaki + butonuna dokunun. Metin yazabilir, fotoğraf ekleyebilir ve gönderinizi kimin görebileceğini seçebilirsiniz (Herkese Açık, Arkadaşlar veya Belirli arkadaşlar).',
    helpQuestion3: 'Beğeni ve beğenmeme nedir?',
    helpAnswer3: 'Gönderileri ve yorumları beğenebilir (👍) veya beğenmeyebilirsiniz (👎). Bir gönderi 10 veya daha fazla beğenmeme alırsa ve beğenmeme sayısı beğeni sayısını geçerse, otomatik olarak kaldırılır.',
    helpQuestion4: 'Nasıl arkadaş eklerim?',
    helpAnswer4: 'Arkadaşlar sekmesine gidin, kullanıcıları arayın ve arkadaşlık isteği gönderin. Kabul edildikten sonra onlarla gönderi paylaşabilirsiniz.',
    helpQuestion5: 'Referans kodu nedir?',
    helpAnswer5: 'Benzersiz referans kodunuzu diğer sürücülerle paylaşabilirsiniz. Kodunuzu kullanarak kayıt olduklarında, her ikiniz de bağlantılı olmaktan faydalanırsınız!',
    helpQuestion6: 'Profil resmimi nasıl değiştirebilirim?',
    helpAnswer6: 'Profil sekmesine gidin ve yeni bir fotoğraf yüklemek için profil resminize dokunun.',
    helpQuestion7: 'Desteğe nasıl ulaşabilirim?',
    helpAnswer7: 'Destek için bize support@drvchat.com adresinden e-posta gönderin',
    
    // About
    aboutTitle: 'Drivers Chat Hakkında',
    aboutDescription: 'Drivers Chat, sürücüler tarafından sürücüler için oluşturulmuş bir topluluk platformudur. Diğer Uber ve Lyft sürücüleriyle bağlantı kurun, deneyimlerinizi paylaşın ve anlamlı bağlantılar oluşturun.',
    aboutVersion: 'Versiyon',
    aboutSupport: 'Destek',
    aboutTerms: 'Şartlar & Koşullar',
    viewTerms: 'Şartlar & Koşulları Görüntüle',
    
    // Terms Modal
    termsTitle: 'Şartlar & Koşullar',
    termsAccept: 'Kabul Ediyorum',
    termsDecline: 'Reddet',
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
    error: 'Error',
    success: 'Éxito',
    fillAllFields: 'Por favor completa todos los campos',
    fillAllRequiredFields: 'Por favor completa todos los campos requeridos',
    selectLanguage: 'Seleccionar Idioma',
    passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
    passwordMinLengthPlaceholder: 'Contraseña (mín. 6 caracteres)',
    referralCodeOptional: 'Código de Referencia (opcional)',
    creatingAccount: 'Creando cuenta...',
    joinDriverCommunity: 'Únete a la comunidad de conductores',
    
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
    loading: 'Cargando...',
    
    // Posts
    createPost: 'Crear Publicación',
    newPost: 'Nueva Publicación',
    editPost: 'Editar Publicación',
    whatsOnYourMind: '¿Qué estás pensando?',
    publishing: 'Publicando...',
    addPhoto: 'Agregar Foto',
    noPostsYet: 'Aún no hay publicaciones',
    beFirstToPost: '¡Sé el primero en publicar!',
    postPublished: 'Tu publicación ha sido publicada',
    writeError: 'Por favor escribe algo',
    failedCreatePost: 'Error al crear publicación',
    postUpdated: 'Publicación actualizada exitosamente',
    failedUpdatePost: 'Error al actualizar publicación',
    postDeleted: 'Publicación eliminada exitosamente',
    failedDeletePost: 'Error al eliminar publicación',
    postRemoved: 'Esta publicación fue eliminada debido a comentarios de la comunidad',
    
    // Privacy
    whoCanSee: '¿Quién puede ver esto?',
    publicEveryone: 'Público - Todos',
    friendsOnly: 'Amigos - Solo amigos',
    specificFriends: 'Específico - Elegir amigos',
    noFriendsYet: 'Aún no tienes amigos. Agrega amigos para compartir con personas específicas.',
    
    // Delete confirmation
    deletePostTitle: 'Eliminar Publicación',
    deletePostMessage: '¿Estás seguro de que quieres eliminar tu publicación?',
    deletePostAdminMessage: '¿Estás seguro de que quieres eliminar esta publicación como administrador?',
    
    // Profile
    viewMyProfile: 'Ver Mi Perfil',
    yourReferralCode: 'Tu Código de Referencia',
    peopleJoined: 'personas se unieron con tu código',
    profilePictureUpdated: '¡Foto de perfil actualizada exitosamente!',
    failedUpdatePicture: 'Error al actualizar foto de perfil',
    logoutError: 'Error al cerrar sesión. Por favor intenta de nuevo.',
    
    // Settings
    accountSettings: 'Configuración de Cuenta',
    changePassword: 'Cambiar Contraseña',
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    updatePassword: 'Actualizar Contraseña',
    deleteAccount: 'Eliminar Cuenta',
    deleteAccountWarning: 'Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.',
    deleteAccountConfirm: 'Eliminar Mi Cuenta',
    language: 'Idioma',
    passwordUpdated: 'Contraseña actualizada exitosamente',
    passwordsDontMatch: 'Las contraseñas no coinciden',
    accountDeleted: 'Cuenta eliminada exitosamente',
    
    // Help
    helpTitle: 'Ayuda & Preguntas Frecuentes',
    helpQuestion1: '¿Qué es Drivers Chat?',
    helpAnswer1: 'Drivers Chat es una plataforma social diseñada específicamente para conductores de Uber y Lyft para conectarse, compartir experiencias y comunicarse entre sí.',
    helpQuestion2: '¿Cómo creo una publicación?',
    helpAnswer2: 'Toca el botón + en la pantalla de inicio. Puedes escribir texto, agregar fotos y elegir quién puede ver tu publicación (Público, Amigos o Amigos específicos).',
    helpQuestion3: '¿Qué son los me gusta y no me gusta?',
    helpAnswer3: 'Puedes dar me gusta (👍) o no me gusta (👎) a publicaciones y comentarios. Si una publicación recibe 10 o más no me gusta y los no me gusta superan los me gusta, se eliminará automáticamente.',
    helpQuestion4: '¿Cómo agrego amigos?',
    helpAnswer4: 'Ve a la pestaña Amigos, busca usuarios y envíales una solicitud de amistad. Una vez aceptada, puedes compartir publicaciones con ellos.',
    helpQuestion5: '¿Qué es un código de referencia?',
    helpAnswer5: 'Tu código de referencia único puede compartirse con otros conductores. ¡Cuando se registren usando tu código, ambos se beneficiarán de estar conectados!',
    helpQuestion6: '¿Cómo cambio mi foto de perfil?',
    helpAnswer6: 'Ve a la pestaña Perfil y toca tu foto de perfil para subir una nueva foto.',
    helpQuestion7: '¿Cómo contacto con soporte?',
    helpAnswer7: 'Para soporte, envíanos un correo a support@drvchat.com',
    
    // About
    aboutTitle: 'Acerca de Drivers Chat',
    aboutDescription: 'Drivers Chat es una plataforma comunitaria construida por conductores, para conductores. Conéctate con otros conductores de Uber y Lyft, comparte tus experiencias y construye conexiones significativas.',
    aboutVersion: 'Versión',
    aboutSupport: 'Soporte',
    aboutTerms: 'Términos y Condiciones',
    viewTerms: 'Ver Términos y Condiciones',
    
    // Terms Modal
    termsTitle: 'Términos y Condiciones',
    termsAccept: 'Acepto',
    termsDecline: 'Rechazar',
  },
};

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  
  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  };
  
  return { t, language };
};
