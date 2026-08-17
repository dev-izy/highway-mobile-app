import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView 
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

export default function HomeScreen(): React.JSX.Element {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
      }
    })();
  }, []);

  const getCurrentLocation = async (): Promise<void> => {
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation.coords);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch current location. Ensure GPS is turned on.');
    } finally {
      setLoading(false);
    }
  };

  const handleSOSPress = (): void => {
    if (!location) {
      Alert.alert('Fetch Location First', 'Please allow the system to detect your location before sending an SOS alert.');
      return;
    }

    Alert.alert(
      '🚨 EMERGENCY ALERT DISPATCHED',
      `Coordinates Sent to FRSC & Emergency Response Units:\n\nLatitude: ${location.latitude}\nLongitude: ${location.longitude}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Highway Emergency System</Text>
        <Text style={styles.subtitle}>Fast accident reporting & alert dispatch</Text>
      </View>

      <View style={styles.centerCard}>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubtext}>TAP FOR EMERGENCY</Text>
        </TouchableOpacity>

        <View style={styles.locationContainer}>
          <TouchableOpacity 
  style={styles.syncNavBtn} 
  onPress={() => router.push('/sync')}
>
  <Text style={styles.syncNavBtnText}>🔄 View Offline Queue & Sync Status</Text>
</TouchableOpacity>

          <TouchableOpacity 
            style={styles.locationBtn} 
            onPress={getCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.locationBtnText}>📍 Get Current GPS Location</Text>
            )}
          </TouchableOpacity>

          {location && (
            <TouchableOpacity 
              style={styles.reportFormBtn} 
              onPress={() => router.push({
                pathname: '/report',
                params: { lat: location.latitude, lng: location.longitude }
              })}
            >
              <Text style={styles.reportFormBtnText}>📝 Fill Detailed Accident Report</Text>
            </TouchableOpacity>
          )}

          {location ? (
            <View style={styles.coordsBox}>
              <Text style={styles.coordText}>Latitude: {location.latitude.toFixed(6)}</Text>
              <Text style={styles.coordText}>Longitude: {location.longitude.toFixed(6)}</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>{errorMsg || 'Fetch location to enable detailed reports.'}</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingTop: 50, paddingHorizontal: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  centerCard: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  sosButton: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#D90429', justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#D90429', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, marginBottom: 30,
  },
  sosText: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: 2 },
  sosSubtext: { color: '#FFD1D1', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  locationContainer: { width: '100%', alignItems: 'center' },
  locationBtn: { backgroundColor: '#2B2D42', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  locationBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  reportFormBtn: { backgroundColor: '#2A9D8F', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 12 },
  reportFormBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  coordsBox: { marginTop: 15, padding: 15, backgroundColor: '#EAEAEA', borderRadius: 8, width: '100%', alignItems: 'center' },
  coordText: { fontSize: 14, fontWeight: '600', color: '#2B2D42' },
  statusText: { marginTop: 12, color: '#888', fontSize: 13 },
  syncNavBtn: { backgroundColor: '#4A5568', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 12 }, 
  syncNavBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});