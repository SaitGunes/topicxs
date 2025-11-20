import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface VoiceRecorderProps {
  onSend: (audioUri: string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
}

export default function VoiceRecorder({ onSend, onCancel, maxDuration = 60 }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access to record voice messages.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!recording) return;

    try {
      console.log('Stopping and unloading recording...');
      await recording.stopAndUnloadAsync();
      
      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      
      if (uri) {
        // Wait a bit for file to be fully written
        console.log('Waiting for file to be written...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsSending(true);
        console.log('Calling onSend with uri:', uri);
        await onSend(uri, recordingDuration);
        setIsSending(false);
      } else {
        console.error('No URI returned from recording');
        Alert.alert('Error', 'Failed to get recording URI');
      }
      
      setRecording(null);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
      setIsSending(false);
    }
  };

  const cancelRecording = async () => {
    console.log('Cancelling recording..');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (err) {
        console.error('Failed to cancel recording', err);
      }
    }

    setRecording(null);
    setIsRecording(false);
    setRecordingDuration(0);
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.sendingText}>Sending voice message...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.recordingInfo}>
        <View style={[styles.recordingIndicator, isRecording && styles.recordingActive]} />
        <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
        <Text style={styles.limitText}>/ {formatDuration(maxDuration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={cancelRecording}
        >
          <Ionicons name="close" size={24} color="#F44336" />
        </TouchableOpacity>

        {!isRecording ? (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
          >
            <Ionicons name="mic" size={32} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
          >
            <Ionicons name="stop" size={32} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.placeholder} />
      </View>

      <Text style={styles.instructionText}>
        {isRecording ? 'Tap to stop recording' : 'Tap mic to start recording'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  recordingActive: {
    backgroundColor: '#F44336',
  },
  durationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  limitText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 48,
  },
  instructionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  sendingText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
});
