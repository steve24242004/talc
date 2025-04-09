import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Animated,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function FindRide({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedRide, setSelectedRide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [locationSelectionMode, setLocationSelectionMode] = useState(null); // 'origin' or 'destination'
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    // Start fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Get current location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
    
    // Fetch rides from Firestore
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      let ridesRef = collection(db, "rides");
      let q = query(
        ridesRef, 
        where("status", "==", "active"),
        where("userId", "!=", currentUser.uid),
        orderBy("userId"), // Required for the inequality filter above
        orderBy("departureDateTime")
      );
      
      // Add filters for origin/destination if they exist
      if (origin) {
        q = query(q, where("origin", "==", origin));
      }
      
      if (destination) {
        q = query(q, where("destination", "==", destination));
      }
      
      const querySnapshot = await getDocs(q);
      const ridesList = [];
      
      querySnapshot.forEach((doc) => {
        const rideData = doc.data();
        ridesList.push({
          id: doc.id,
          ...rideData,
          departureDateTime: rideData.departureDateTime.toDate()
        });
      });
      
      setRides(ridesList);
    } catch (error) {
      console.error("Error fetching rides:", error);
      Alert.alert("Error", "Failed to load available rides");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString() + ' at ' + 
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRequestRide = (ride) => {
    setSelectedRide(ride);
    setModalVisible(true);
  };

  const submitRequest = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message to the driver");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      
      // Update the ride document with the request
      const rideRef = doc(db, "rides", selectedRide.id);
      
      // Add request to ride's requests array
      await updateDoc(rideRef, {
        requests: [
          ...((selectedRide.requests || [])),
          {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            message: message,
            status: "pending",
            timestamp: new Date()
          }
        ]
      });
      
      Alert.alert(
        "Success", 
        "Your ride request has been sent to the driver!",
        [{ text: "OK", onPress: () => {
          setModalVisible(false);
          setMessage('');
        }}]
      );
      
    } catch (error) {
      console.error("Error sending request:", error);
      Alert.alert("Error", "Failed to send ride request. Please try again.");
    }
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const openLocationPicker = (mode) => {
    setLocationSelectionMode(mode);
    setLocationPickerVisible(true);
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
      } else {
        setDestination(address);
      }
      
      setLocationPickerVisible(false);
      setSelectedLocation(null);
      
      // Fetch rides with new filters
      fetchRides();
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

  const renderRide = ({ item }) => (
    <Animated.View style={[styles.rideItem, { opacity: fadeAnim }]}>
      <View style={styles.rideHeader}>
        <Text style={styles.routeText}>{item.origin} → {item.destination}</Text>
        <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.rideDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(item.departureDateTime)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.availableSeats} {item.availableSeats === 1 ? 'seat' : 'seats'} available
          </Text>
        </View>
        
        {item.additionalInfo ? (
          <View style={styles.detailRow}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.detailText}>{item.additionalInfo}</Text>
          </View>
        ) : null}
        
        <TouchableOpacity 
          style={styles.requestButton}
          onPress={() => handleRequestRide(item)}
        >
          <Text style={styles.requestButtonText}>Request Ride</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>Available Rides</Text>
        <TouchableOpacity onPress={toggleMap} style={styles.mapButton}>
          <Ionicons name={showMap ? "list" : "map"} size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => openLocationPicker('origin')}
          >
            <Ionicons name="location" size={18} color="#007bff" />
            <Text style={styles.filterButtonText}>
              {origin || "From Where?"}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={18} color="#666" />
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => openLocationPicker('destination')}
          >
            <Ionicons name="location" size={18} color="#007bff" />
            <Text style={styles.filterButtonText}>
              {destination || "To Where?"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showMap ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            showsUserLocation={true}
          >
            {rides.map((ride) => (
              <Marker
                key={ride.id}
                coordinate={{
                  latitude: ride.originCoords?.latitude || mapRegion.latitude,
                  longitude: ride.originCoords?.longitude || mapRegion.longitude
                }}
                title={ride.origin}
                description={`To: ${ride.destination} | $${ride.price}`}
                pinColor="#007bff"
              />
            ))}
          </MapView>
        </View>
      ) : (
        loading ? (
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        ) : rides.length > 0 ? (
          <FlatList
            data={rides}
            renderItem={renderRide}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ridesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No rides available</Text>
            <Text style={styles.emptySubtext}>Check back later for new rides!</Text>
          </View>
        )
      )}

      {/* Location Picker Modal */}
      <Modal
        visible={locationPickerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={() => setLocationPickerVisible(false)}
            >
              <Ionicons name="close" size={24} color="#007bff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {locationSelectionMode === 'origin' ? 'Origin' : 'Destination'}
            </Text>
            <TouchableOpacity 
              style={styles.modalConfirmButton}
              onPress={confirmLocationSelection}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          
          <MapView
            style={styles.locationPickerMap}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            showsUserLocation={true}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                pinColor="#007bff"
              />
            )}
          </MapView>
          
          <Text style={styles.mapInstructions}>
            Tap on the map to select your {locationSelectionMode === 'origin' ? 'starting point' : 'destination'}
          </Text>
        </View>
      </Modal>

      {/* Request Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Ride</Text>
            
            {selectedRide && (
              <View style={styles.modalRideInfo}>
                <Text style={styles.modalRouteText}>
                  {selectedRide.origin} → {selectedRide.destination}
                </Text>
                <Text style={styles.modalDateText}>
                  {formatDate(selectedRide.departureDateTime)}
                </Text>
              </View>
            )}
            
            <Text style={styles.modalLabel}>Message to driver:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Introduce yourself and explain why you need this ride..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSubmitButton}
                onPress={submitRequest}
              >
                <Text style={styles.modalSubmitText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    marginBottom: 10
  },
  backButton: {
    padding: 5
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center'
  },
  mapButton: {
    padding: 5
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 0.45
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5
  },
  arrowContainer: {
    flex: 0.1,
    alignItems: 'center'
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  ridesList: {
    padding: 15
  },
  rideItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745'
  },
  rideDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 8
  },
  requestButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  modalRideInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15
  },
  modalRouteText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalDateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  modalCancelButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center'
  },
  modalSubmitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center'
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500'
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden'
  },
  map: {
    width: '100%',
    height: '100%'
  },
  locationPickerMap: {
    width: '100%',
    height: '80%'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    marginBottom: 10
  },
  modalBackButton: {
    padding: 5
  },
  modalConfirmButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '500'
  },
  mapInstructions: {
    textAlign: 'center',
    padding: 15,
    color: '#666',
    fontSize: 16
  }
});