import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function OfferRide({ navigation }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [availableSeats, setAvailableSeats] = useState('');
  const [price, setPrice] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Form validation
    if (!origin || !destination || !availableSeats || !price) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (parseInt(availableSeats) <= 0) {
      Alert.alert("Error", "Available seats must be greater than 0");
      return;
    }

    // Combine date and time
    const combinedDateTime = new Date(departureDate);
    combinedDateTime.setHours(
      departureTime.getHours(),
      departureTime.getMinutes()
    );

    // Check if date is in the past
    if (combinedDateTime < new Date()) {
      Alert.alert("Error", "Departure date/time cannot be in the past");
      return;
    }

    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      // Create ride document in Firestore
      await addDoc(collection(db, "rides"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        origin,
        destination,
        departureDateTime: combinedDateTime,
        availableSeats: parseInt(availableSeats),
        price: parseFloat(price),
        additionalInfo: additionalInfo || "",
        createdAt: serverTimestamp(),
        status: "active"
      });

      Alert.alert(
        "Success", 
        "Your ride has been published!",
        [{ text: "OK", onPress: () => navigation.navigate("Home") }]
      );
      
      // Reset form
      setOrigin('');
      setDestination('');
      setDepartureDate(new Date());
      setDepartureTime(new Date());
      setAvailableSeats('');
      setPrice('');
      setAdditionalInfo('');
      
    } catch (error) {
      console.error("Error publishing ride:", error);
      Alert.alert("Error", "Failed to publish ride. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDepartureDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setDepartureTime(selectedTime);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#007bff" />
            </TouchableOpacity>
            <Text style={styles.title}>Offer a Ride</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Origin *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location"
              value={origin}
              onChangeText={setOrigin}
            />

            <Text style={styles.label}>Destination *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              value={destination}
              onChangeText={setDestination}
            />

            <Text style={styles.label}>Departure Date *</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{departureDate.toLocaleDateString()}</Text>
              <Ionicons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={departureDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Departure Time *</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowTimePicker(true)}
            >
              <Text>{departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="time" size={20} color="#666" />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={departureTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}

            <Text style={styles.label}>Available Seats *</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of available seats"
              value={availableSeats}
              onChangeText={setAvailableSeats}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Price per Seat ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Price per seat"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Additional Information</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional details passengers should know"
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity 
              style={styles.publishButton} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.publishButtonText}>
                {loading ? "Publishing..." : "Publish Ride"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f9f9f9',
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    marginBottom: 20
  },
  backButton: {
    padding: 5
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15
  },
  formContainer: {
    paddingHorizontal: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
    marginTop: 15
  },
  input: {
    backgroundColor: '#fff',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16
  },
  dateInput: {
    backgroundColor: '#fff',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: 'top'
  },
  publishButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center'
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});