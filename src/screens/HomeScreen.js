import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function HomeScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('LoginScreen'); // Navigate after 3s
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* App Logo */}
      <Image source={require('../../assets/images/Logo.jpg')} style={styles.logo} />
      
      <Text style={styles.text}>Welcome to TALC!</Text>
      <Text style={styles.subText}>Redirecting to Login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  logo: { width: 150, height: 150, marginBottom: 20 }, // Adjust logo size
  text: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subText: { fontSize: 16, color: 'gray', marginTop: 10 }
});
