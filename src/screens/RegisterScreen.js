import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { auth, db } from '../firebaseConfig'; // Import Firebase config
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !mobile) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user details in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email,
        mobile,
        createdAt: new Date()
      });

      Alert.alert('Success', 'Account created successfully!');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setMobile('');

      navigation.navigate('LoginScreen');
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error("Registration error:", error.message);

    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/Logo.jpg')} style={styles.logo} />
      <Text style={styles.title}>Register</Text>
      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('LoginScreen')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  logo: { width: 150, height: 150, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: { width: '80%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
  button: { backgroundColor: '#007bff', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { marginTop: 10 },
  linkText: { color: '#007bff', fontSize: 14 }
});
