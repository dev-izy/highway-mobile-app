import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  SafeAreaView,
  ViewStyle,
  TextStyle,
  ImageStyle
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReportScreen(): React.JSX.Element {
  const { lat, lng } = useLocalSearchParams<{ lat: string; lng: string }>();
  const router = useRouter();

  const latitude = Array.isArray(lat) ? lat[0] : lat;
  const longitude = Array.isArray(lng) ? lng[0] : lng;

  const [highwayName, setHighwayName] = useState<string>('Lagos-Ibadan Expressway');
  const [severity, setSeverity] = useState<string>('Moderate');
  const [description, setDescription] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission denied', 'Camera access is required to capture accident scenes.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Inside app/report.tsx handleSubmitReport function:
const handleSubmitReport = async () => {
  if (!description.trim()) {
    Alert.alert('Missing Info', 'Please provide a brief description of the incident.');
    return;
  }

 setSubmitting(true);
  const newReport = {
    id: `INC-${Math.floor(100 + Math.random() * 900)}`,
    highway: highwayName,
    severity,
    description,
    latitude: latitude ? Number(latitude) : 6.6923,
    longitude: longitude ? Number(longitude) : 3.4285,
    image: imageUri,
    timestamp: new Date().toLocaleTimeString(),
  };

  try {
    // Attempt live server sync (Use local IP address if testing on physical phone)
    await fetch('http://localhost:5000/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport),
    });

    Alert.alert('Report Live!', 'Your emergency report was transmitted immediately to the FRSC control center.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  } catch (error) {
    // Save to offline storage if server unreachable
    const existingData = await AsyncStorage.getItem('@offline_reports');
    const reports = existingData ? JSON.parse(existingData) : [];
    reports.push({ ...newReport, synced: false });
    await AsyncStorage.setItem('@offline_reports', JSON.stringify(reports));

    Alert.alert('Saved Offline', 'Network connection unavailable. Report queued locally.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Accident Incident Report</Text>
        <Text style={styles.coordsSub}>
          GPS: {latitude ? Number(latitude).toFixed(4) : '0'}, {longitude ? Number(longitude).toFixed(4) : '0'}
        </Text>

        <Text style={styles.label}>Highway / Route Name</Text>
        <TextInput 
          style={styles.input} 
          value={highwayName} 
          onChangeText={setHighwayName} 
          placeholder="e.g. Lagos-Ibadan Expressway"
        />

        <Text style={styles.label}>Incident Severity</Text>
        <View style={styles.severityRow}>
          {['Minor', 'Moderate', 'Severe / Fatal'].map((level) => (
            <TouchableOpacity 
              key={level} 
              style={[styles.severityBtn, severity === level && styles.severitySelected]}
              onPress={() => setSeverity(level)}
            >
              <Text style={[styles.severityText, severity === level && styles.severityTextSelected]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description / Details</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={description} 
          onChangeText={setDescription} 
          placeholder="Describe vehicles involved, blockages, or injuries..." 
          multiline 
          numberOfLines={4}
        />

        <Text style={styles.label}>Scene Photo Evidence</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoBtnText}>📸 {imageUri ? 'Retake Photo' : 'Capture Photo'}</Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmitReport}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Saving...' : 'Submit & Queue Report'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#F8F9FA' } as ViewStyle,
  scroll: { padding: 20 } as ViewStyle,
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' } as TextStyle,
  coordsSub: { fontSize: 13, color: '#2A9D8F', marginTop: 2, marginBottom: 20, fontWeight: '600' } as TextStyle,
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6, marginTop: 12 } as TextStyle,
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 15, color: '#333' } as TextStyle,
  textArea: { height: 100, textAlignVertical: 'top' } as TextStyle,
  severityRow: { flexDirection: 'row', justifyContent: 'space-between' } as ViewStyle,
  severityBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#CCC', borderRadius: 8, alignItems: 'center', marginHorizontal: 4, backgroundColor: '#FFF' } as ViewStyle,
  severitySelected: { backgroundColor: '#2B2D42', borderColor: '#2B2D42' } as ViewStyle,
  severityText: { fontSize: 12, color: '#555', fontWeight: '600' } as TextStyle,
  severityTextSelected: { color: '#FFF' } as TextStyle,
  photoBtn: { backgroundColor: '#E9ECEF', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#CED4DA' } as ViewStyle,
  photoBtnText: { color: '#495057', fontWeight: 'bold' } as TextStyle,
  previewImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 10, resizeMode: 'cover' } as ImageStyle,
  submitBtn: { backgroundColor: '#D90429', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 40 } as ViewStyle,
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' } as TextStyle,
};