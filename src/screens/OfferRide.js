import React, { useState, useEffect } from 'react';
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
  Keyboard,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

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
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [locationSelectionMode, setLocationSelectionMode] = useState(null); // 'origin' or 'destination'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    // Get current location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

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
        originCoords: originCoords || null,
        destinationCoords: destinationCoords || null,
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
      setOriginCoords(null);
      setDestinationCoords(null);
      
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

  const openLocationPicker = (mode) => {
    setLocationSelectionMode(mode);
    setMapPickerVisible(true);
  };

  const handleMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
  };

  const confirmLocationSelection = async () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }

    try {
      // Reverse geocode to get address
      const address = await reverseGeocode(selectedLocation);
      
      if (locationSelectionMode === 'origin') {
        setOrigin(address);
        setOriginCoords(selectedLocation);
      } else {
        setDestination(address);
        setDestinationCoords(selectedLocation);
      }
      
      setMapPickerVisible(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error("Error with geocoding:", error);
      Alert.alert("Error", "Could not get address from location");
    }
  };

  const reverseGeocode = async (coords) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      
      if (result && result.length > 0) {
        const { city, region, country } = result[0];
        return `${city || ""}, ${region || ""}, ${country || ""}`.replace(/^, /, '').replace(/, $/, '');
      }
      
      return `(${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `(${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
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
            <View style={styles.mapPreviewContainer}>
              <MapView
                style={styles.mapPreview}
                provider={PROVIDER_GOOGLE}
                region={mapRegion}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                {originCoords && (
                  <Marker
                    coordinate={originCoords}
                    title="Origin"
                    pinColor="#007bff"
                  />
                )}
                {destinationCoords && (
                  <Marker
                    coordinate={destinationCoords}
                    title="Destination"
                    pinColor="#28a745"
                  />
                )}
              </MapView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Origin *</Text>
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={styles.locationInput}
                  value={origin}
                  onChangeText={setOrigin}
                  placeholder="Where are you starting from?"
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity 
                  style={styles.mapPickerButton}
                  onPress={() => openLocationPicker('origin')}
                >
                  <Ionicons name="location" size={24} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Destination *</Text>
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={styles.locationInput}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Where are you going?"
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity 
                  style={styles.mapPickerButton}
                  onPress={() => openLocationPicker('destination')}
                >
                  <Ionicons name="location" size={24} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeInput}>
                <Text style={styles.label}>Departure Date *</Text>
                <TouchableOpacity 
                  style={styles.dateTimePicker} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {departureDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar" size={24} color="#007bff" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateTimeInput}>
                <Text style={styles.label}>Departure Time *</Text>
                <TouchableOpacity 
                  style={styles.dateTimePicker} 
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Ionicons name="time" size={24} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={departureDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={departureTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}

            <View style={styles.detailsContainer}>
              <View style={styles.detailInput}>
                <Text style={styles.label}>Available Seats *</Text>
                <TextInput
                  style={styles.inputField}
                  value={availableSeats}
                  onChangeText={setAvailableSeats}
                  placeholder="Number of seats"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.detailInput}>
                <Text style={styles.label}>Price per Seat ($) *</Text>
                <TextInput
                  style={styles.inputField}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Price in $"
                  placeholderTextColor="#aaa"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Information</Text>
              <TextInput
                style={styles.textArea}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="Any other details about your ride..."
                placeholderTextColor="#aaa"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>Publishing...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Publish Ride</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Map Location Picker Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={mapPickerVisible}
        onRequestClose={() => setMapPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {locationSelectionMode === 'origin' ? 'Origin' : 'Destination'} Location
            </Text>
            <TouchableOpacity onPress={() => setMapPickerVisible(false)}>
              <Ionicons name="close" size={24} color="#007bff" />
            </TouchableOpacity>
          </View>
          
          <MapView
            style={styles.mapFull}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                pinColor={locationSelectionMode === 'origin' ? "#007bff" : "#28a745"}
              />
            )}
          </MapView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setMapPickerVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={confirmLocationSelection}
            >
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 16,
  },
  mapPreviewContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    height: 150,
    backgroundColor: '#e1e1e1',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapPickerButton: {
    padding: 12,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateTimeInput: {
    width: '48%',
  },
  dateTimePicker: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailInput: {
    width: '48%',
  },
  inputField: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#a7cbf3',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapFull: {
    width: '100%',
    height: '80%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  }
});