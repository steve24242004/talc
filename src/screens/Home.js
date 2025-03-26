import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Home({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Logout Button (Top Right) */}
      <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.replace('LoginScreen')}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Logo */}
      <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />

      {/* Welcome Message */}
      <Text style={styles.title}>Where do you want to go?</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="location-outline" size={20} color="#888" style={styles.icon} />
        <TextInput style={styles.input} placeholder="Enter your destination" placeholderTextColor="#aaa" />
      </View>

      {/* Buttons */}
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', paddingHorizontal: 20 },
  logoutButton: { 
    position: 'absolute', 
    top: 40, 
    right: 20, 
    backgroundColor: '#ff3b30', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 8 
  },
  logoutText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, width: '100%', elevation: 3 },
  input: { flex: 1, fontSize: 16 },
  icon: { marginRight: 10 },
  findRideButton: { backgroundColor: '#007bff', paddingVertical: 12, width: '100%', borderRadius: 10, marginTop: 20, alignItems: 'center' },
  offerRideButton: { backgroundColor: '#28a745', paddingVertical: 12, width: '100%', borderRadius: 10, marginTop: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
