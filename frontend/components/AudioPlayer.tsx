import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface AudioPlayerProps {
  audioUri: string;
  duration?: number;
  isOwnMessage?: boolean;
}

export default function AudioPlayer({ audioUri, duration = 0, isOwnMessage = false }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [soundDuration, setSoundDuration] = useState(duration * 1000); // Convert to milliseconds

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async () => {
    try {
      setIsLoading(true);
      
      if (sound) {
        // Resume if paused
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        
        // Load and play
        console.log('Loading Sound from:', audioUri);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
        console.log('Sound loaded and playing');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error playing sound:', error);
      console.error('Audio URI was:', audioUri);
      setIsLoading(false);
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis);
      setSoundDuration(status.durationMillis || duration * 1000);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentPosition(0);
      }
    }
  };

  const formatTime = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = soundDuration > 0 ? (currentPosition / soundDuration) * 100 : 0;

  return (
    <View style={[styles.container, isOwnMessage && styles.ownContainer]}>
      <TouchableOpacity
        style={[styles.playButton, isOwnMessage && styles.ownPlayButton]}
        onPress={isPlaying ? pauseSound : playSound}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isOwnMessage ? '#fff' : '#007AFF'} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={isOwnMessage ? '#fff' : '#007AFF'}
          />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progress,
              { width: `${progress}%` },
              isOwnMessage && styles.ownProgress
            ]}
          />
        </View>
        <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
          {isPlaying ? formatTime(currentPosition) : formatTime(soundDuration)}
        </Text>
      </View>

      <Ionicons
        name="mic"
        size={16}
        color={isOwnMessage ? 'rgba(255,255,255,0.7)' : '#999'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    minWidth: 200,
  },
  ownContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownPlayButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  waveformContainer: {
    flex: 1,
    marginRight: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progress: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  ownProgress: {
    backgroundColor: '#fff',
  },
  timeText: {
    fontSize: 10,
    color: '#666',
  },
  ownTimeText: {
    color: 'rgba(255,255,255,0.9)',
  },
});
