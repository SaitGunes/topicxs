import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export async function clearAllCache() {
  try {
    console.log('🧹 Clearing all cache...');
    
    // Clear AsyncStorage
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared');
    
    // Clear Expo cache directory
    const cacheDirectory = FileSystem.cacheDirectory;
    if (cacheDirectory) {
      const files = await FileSystem.readDirectoryAsync(cacheDirectory);
      await Promise.all(
        files.map(file => 
          FileSystem.deleteAsync(`${cacheDirectory}${file}`, { idempotent: true })
        )
      );
      console.log('✅ Expo cache cleared');
    }
    
    console.log('✅ All cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}
