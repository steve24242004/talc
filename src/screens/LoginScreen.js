import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig"; // Ensure Firestore is imported if needed
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginScreen({ navigation }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getEmailFromUsername = async (username) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data().email;
      } else {
        throw new Error("Username not found");
      }
    } catch (error) {
      console.error("Error fetching email:", error);
      throw error;
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    
    let email = emailOrUsername;

    if (!email.includes("@")) {
      try {
        email = await getEmailFromUsername(emailOrUsername);
      } catch (error) {
        setLoading(false);
        return Alert.alert("Login Failed", "Invalid username or email.");
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in:", userCredential.user);
      navigation.replace("Home");
    } catch (error) {
      console.error("Login error:", error.message);
      Alert.alert("Login Failed", mapFirebaseError(error.code));
    } finally {
      setLoading(false);
    }
  };

  const mapFirebaseError = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Invalid email format.";
      case "auth/user-not-found":
        return "User does not exist.";
      case "auth/wrong-password":
        return "Incorrect password.";
      default:
        return "Login failed. Please try again.";
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <Image source={require('../../assets/images/Logo.jpg')} style={styles.logo} />
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email or Username"
        value={emailOrUsername}
        onChangeText={setEmailOrUsername}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <Text style={styles.buttonText}>Loading...</Text> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('RegisterScreen')}>
        <Text style={styles.linkText}>New to TALC? Register here</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: { width: '80%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15 },
  button: { backgroundColor: '#007bff', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { marginTop: 10 },
  linkText: { color: '#007bff', fontSize: 14 },
  logo: { width: 150, height: 150, marginBottom: 20 }
});
