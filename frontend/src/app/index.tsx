import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>AGRITECH PORTAL</Text>
          <Text style={styles.appSubtitle}>Field Intelligence & Gap Detection Platform</Text>
        </View>

        {/* Modules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Modules</Text>

          {/* Module 1: Gap Detection */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={() => router.push('/gap-detection')}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.cardIcon}>🌱</Text>
              </View>
              <View style={styles.badgeActive}>
                <Text style={styles.badgeTextActive}>Active</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Gap Detection</Text>
            <Text style={styles.cardDescription}>
              Analyze plantation aerial/canopy images with KML boundaries to identify missing plants, count gaps, and estimate yield loss.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardActionText}>Launch Module</Text>
              <Text style={styles.cardArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Module 2: Weed Detection (Coming Soon) */}
          <View style={[styles.card, styles.cardDisabled]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, styles.iconContainerDisabled]}>
                <Text style={styles.cardIcon}>🌾</Text>
              </View>
              <View style={styles.badgeDisabled}>
                <Text style={styles.badgeTextDisabled}>Coming Soon</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, styles.textDisabled]}>Weed Detection</Text>
            <Text style={[styles.cardDescription, styles.textDisabled]}>
              Identify invasive weed patches and analyze infestation density to optimize herbicide spray schedules.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardActionText, styles.textDisabled]}>Unavailable</Text>
              <Text style={[styles.cardArrow, styles.textDisabled]}>→</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121318',
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    fontFamily: 'System',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#8f92a1',
    marginTop: 8,
    fontWeight: '500',
    fontFamily: 'System',
  },
  section: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8f92a1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: 'System',
  },
  card: {
    backgroundColor: '#1a1b22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2e303a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardDisabled: {
    opacity: 0.5,
    borderColor: '#22232a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDisabled: {
    backgroundColor: 'rgba(143, 146, 161, 0.1)',
  },
  cardIcon: {
    fontSize: 22,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeTextActive: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeDisabled: {
    backgroundColor: 'rgba(143, 146, 161, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(143, 146, 161, 0.3)',
  },
  badgeTextDisabled: {
    color: '#8f92a1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'System',
  },
  cardDescription: {
    fontSize: 14,
    color: '#8f92a1',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'System',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2e303a',
    paddingTop: 16,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'System',
  },
  cardArrow: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '700',
  },
  textDisabled: {
    color: '#5e6070',
    borderColor: 'transparent',
  },
});
