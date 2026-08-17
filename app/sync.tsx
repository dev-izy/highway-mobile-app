import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface AccidentReport {
  id: string;
  highway: string;
  severity: string;
  description: string;
  latitude: number | string;
  longitude: number | string;
  timestamp: string;
  synced: boolean;
}

export default function SyncScreen(): React.JSX.Element {
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  // 1. Fetch queued local reports
  const loadReports = async () => {
    try {
      const storedData = await AsyncStorage.getItem('@offline_reports');
      if (storedData) {
        setReports(JSON.parse(storedData));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load local reports.');
    }
  };

  // 2. Monitor Network Status & auto-trigger sync if online
  useEffect(() => {
    loadReports();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // 3. Sync pending reports to backend API
  const handleSyncNow = async () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'You are currently offline. Connect to the internet to sync reports.');
      return;
    }

    const unSyncedReports = reports.filter((r) => !r.synced);
    if (unSyncedReports.length === 0) {
      Alert.alert('All Clear', 'No pending offline reports to sync.');
      return;
    }

    setSyncing(true);

    try {
      // Simulate API POST request to emergency backend endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark all synced reports as true
      const updatedReports = reports.map((report) => ({
        ...report,
        synced: true,
      }));

      await AsyncStorage.setItem('@offline_reports', JSON.stringify(updatedReports));
      setReports(updatedReports);

      Alert.alert('Sync Complete', `${unSyncedReports.length} report(s) successfully dispatched to emergency servers.`);
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to upload reports. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // 4. Clear stored reports
  const clearHistory = async () => {
    await AsyncStorage.removeItem('@offline_reports');
    setReports([]);
    Alert.alert('Cleared', 'Local report cache cleared.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync & Offline Queue</Text>
        <View style={[styles.badge, { backgroundColor: isConnected ? '#2A9D8F' : '#E63946' }]}>
          <Text style={styles.badgeText}>
            {isConnected ? '● Connected (Online)' : '● Offline Mode'}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.syncBtn, (!isConnected || syncing) && styles.syncBtnDisabled]} 
        onPress={handleSyncNow}
        disabled={!isConnected || syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.syncBtnText}>🔄 Sync Pending Reports Now</Text>
        )}
      </TouchableOpacity>

      <View style={styles.listContainer}>
        <Text style={styles.sectionHeader}>Saved Local Reports ({reports.length})</Text>

        {reports.length === 0 ? (
          <Text style={styles.emptyText}>No saved reports on this device.</Text>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.highwayText}>{item.highway}</Text>
                  <Text style={[styles.statusTag, item.synced ? styles.synced : styles.pending]}>
                    {item.synced ? 'Synced' : 'Pending'}
                  </Text>
                </View>
                <Text style={styles.desc}>{item.description}</Text>
                <Text style={styles.meta}>Severity: {item.severity}</Text>
                <Text style={styles.meta}>
                  GPS: {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {reports.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
          <Text style={styles.clearBtnText}>🗑 Clear Cache</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  header: { marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  syncBtn: { backgroundColor: '#2B2D42', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  listContainer: { flex: 1 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  highwayText: { fontWeight: 'bold', fontSize: 15, color: '#1A1A1A' },
  statusTag: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  synced: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  pending: { backgroundColor: '#FFEBEE', color: '#C62828' },
  desc: { color: '#555', marginTop: 6, fontSize: 13 },
  meta: { color: '#888', fontSize: 11, marginTop: 2 },
  clearBtn: { padding: 12, alignItems: 'center', marginTop: 10 },
  clearBtnText: { color: '#E63946', fontWeight: 'bold' },
});