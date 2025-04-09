import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from "firebase/auth";

export default function Home({ navigation }) {
  const auth = getAuth(); // Ensure auth instance is available

  const handleLogout = async () => {
    try {
      await signOut(auth); // Logout user
      navigation.replace('LoginScreen'); // Replace to prevent going back
    } catch (error) {
      console.error("Logout Failed:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Image source={require('../../assets/images/Logo.jpg')} style={styles.logo} />
      <Text style={styles.title}>Where do you want to go?</Text>

      <TouchableOpacity style={styles.findRideButton} onPress={() => navigation.navigate('FindRide')}>
        <Text style={styles.buttonText}>Find a Ride</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.offerRideButton} onPress={() => navigation.navigate('OfferRide')}>
        <Text style={styles.buttonText}>Offer a Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  logoutButton: { position: 'absolute', top: 40, right: 20, backgroundColor: '#ff3b30', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  findRideButton: { backgroundColor: '#007bff', paddingVertical: 12, width: '100%', borderRadius: 10, marginTop: 20, alignItems: 'center' },
  offerRideButton: { backgroundColor: '#28a745', paddingVertical: 12, width: '100%', borderRadius: 10, marginTop: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
