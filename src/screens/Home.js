import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ImageBackground, 
  ScrollView, 
  Dimensions, 
  StatusBar, 
  SafeAreaView,
  Animated 
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getAuth, signOut } from "firebase/auth";
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function Home({ navigation }) {
  const auth = getAuth();
  const [userName, setUserName] = useState('');
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  useEffect(() => {
    // Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Get user name
    const user = auth.currentUser;
    if (user) {
      const displayName = user.displayName || user.email.split('@')[0];
      setUserName(displayName);
      
      // Fetch upcoming rides
      const fetchUpcomingRides = async () => {
        try {
          const today = new Date();
          
          // Fetch rides user is offering
          const offeredRidesQuery = query(
            collection(db, "rides"),
            where("userId", "==", user.uid),
            where("departureDateTime", ">=", today),
            limit(2)
          );
          
          // Fetch rides user has booked
          const bookedRidesQuery = query(
            collection(db, "bookings"),
            where("passengerId", "==", user.uid),
            where("departureDateTime", ">=", today),
            limit(2)
          );
          
          const [offeredSnapshot, bookedSnapshot] = await Promise.all([
            getDocs(offeredRidesQuery),
            getDocs(bookedRidesQuery)
          ]);
          
          const offered = offeredSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'offered'
          }));
          
          const booked = bookedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'booked'
          }));
          
          // Combine and sort by departure date
          const combined = [...offered, ...booked].sort((a, b) => {
            return a.departureDateTime.toDate() - b.departureDateTime.toDate();
          });
          
          setUpcomingRides(combined);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching upcoming rides:", error);
          setLoading(false);
        }
      };
      
      fetchUpcomingRides();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('LoginScreen');
    } catch (error) {
      console.error("Logout Failed:", error.message);
    }
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <ImageBackground 
          source={require('../../assets/images/road_background.jpg')} 
          style={styles.headerBg}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerContent}>
              <View style={styles.userInfo}>
                <Image 
                  source={require('../../assets/images/Logo.jpg')} 
                  style={styles.logo} 
                />
                <View>
                  <Text style={styles.welcomeText}>Welcome back,</Text>
                  <Text style={styles.userName}>{userName}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
        
        {/* Main Content */}
        <Animated.View 
          style={[
            styles.mainContent, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Action Cards */}
          <View style={styles.actionCardsContainer}>
            <TouchableOpacity 
              style={[styles.actionCard, styles.findRideCard]}
              onPress={() => navigation.navigate('FindRide')}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.actionCardIcon}>
                  <Ionicons name="search" size={28} color="#fff" />
                </View>
                <Text style={styles.actionCardTitle}>Find a Ride</Text>
                <Text style={styles.actionCardDesc}>Search for available rides to your destination</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#007bff" style={styles.cardArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, styles.offerRideCard]}
              onPress={() => navigation.navigate('OfferRide')}
            >
              <View style={styles.actionCardContent}>
                <View style={[styles.actionCardIcon, styles.offerRideIcon]}>
                  <Ionicons name="car" size={28} color="#fff" />
                </View>
                <Text style={styles.actionCardTitle}>Offer a Ride</Text>
                <Text style={styles.actionCardDesc}>Share your journey and reduce travel costs</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="#28a745" style={styles.cardArrow} />
            </TouchableOpacity>
          </View>
          
          {/* Upcoming Rides Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Rides</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyRides')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading your rides...</Text>
              </View>
            ) : upcomingRides.length > 0 ? (
              upcomingRides.map((ride, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.rideCard}
                  onPress={() => navigation.navigate('RideDetails', { id: ride.id, type: ride.type })}
                >
                  <View style={styles.rideCardHeader}>
                    <Text style={[
                      styles.rideType, 
                      ride.type === 'offered' ? styles.rideTypeOffered : styles.rideTypeBooked
                    ]}>
                      {ride.type === 'offered' ? 'You\'re driving' : 'You\'re a passenger'}
                    </Text>
                    <Text style={styles.rideDate}>{formatDate(ride.departureDateTime)}</Text>
                  </View>
                  
                  <View style={styles.rideDetails}>
                    <View style={styles.locationContainer}>
                      <View style={styles.locationPoint}>
                        <View style={[styles.locationDot, styles.originDot]} />
                        <Text style={styles.locationTime}>{formatTime(ride.departureDateTime)}</Text>
                      </View>
                      <Text style={styles.locationText} numberOfLines={1}>{ride.origin}</Text>
                    </View>
                    
                    <View style={styles.routeLine} />
                    
                    <View style={styles.locationContainer}>
                      <View style={styles.locationPoint}>
                        <View style={[styles.locationDot, styles.destinationDot]} />
                        <Text style={styles.locationTime}>
                          {ride.arrivalTime ? formatTime(ride.arrivalTime) : 'ETA'}
                        </Text>
                      </View>
                      <Text style={styles.locationText} numberOfLines={1}>{ride.destination}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.rideFooter}>
                    {ride.type === 'offered' ? (
                      <View style={styles.passengerInfo}>
                        <FontAwesome5 name="users" size={14} color="#666" />
                        <Text style={styles.passengerText}>
                          {ride.bookedSeats || 0}/{ride.availableSeats} passengers
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.passengerInfo}>
                        <FontAwesome5 name="user" size={14} color="#666" />
                        <Text style={styles.passengerText}>
                          {ride.driverName || 'Driver'}
                        </Text>
                      </View>
                    )}
                    
                    <Text style={styles.priceText}>${ride.price}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyRidesContainer}>
                <Ionicons name="car-outline" size={48} color="#ccc" />
                <Text style={styles.emptyRidesText}>No upcoming rides</Text>
                <Text style={styles.emptyRidesSubtext}>
                  Find or offer a ride to get started
                </Text>
              </View>
            )}
          </View>
          
          {/* Quick Access Section */}
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('MyRides')}
            >
              <Ionicons name="list" size={24} color="#007bff" />
              <Text style={styles.quickAccessText}>My Rides</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person" size={24} color="#007bff" />
              <Text style={styles.quickAccessText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={24} color="#007bff" />
              <Text style={styles.quickAccessText}>Alerts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings" size={24} color="#007bff" />
              <Text style={styles.quickAccessText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#007bff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  headerBg: {
    height: 180,
    width: '100%',
  },
  headerOverlay: {
    backgroundColor: 'rgba(0, 123, 255, 0.85)',
    height: '100%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: '#f0f2f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 180,
  },
  findRideCard: {
    borderTopColor: '#007bff',
    borderTopWidth: 4,
  },
  offerRideCard: {
    borderTopColor: '#28a745',
    borderTopWidth: 4,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  offerRideIcon: {
    backgroundColor: '#28a745',
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  cardArrow: {
    alignSelf: 'flex-end',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#007bff',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
    fontWeight: '500',
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideType: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rideTypeOffered: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    color: '#28a745',
  },
  rideTypeBooked: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    color: '#007bff',
  },
  rideDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  rideDetails: {
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  locationPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  originDot: {
    backgroundColor: '#007bff',
  },
  destinationDot: {
    backgroundColor: '#28a745',
  },
  locationTime: {
    fontSize: 12,
    color: '#666',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 4,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  emptyRidesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginTop: 8,
  },
  emptyRidesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
  },
  emptyRidesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickAccessButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '22%',
  },
  quickAccessText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  }
});