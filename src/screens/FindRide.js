import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Sample ride data (Replace this with API data in production)
const ridesData = [
  {
    id: '1',
    driver: 'John Doe',
    from: 'City A',
    to: 'City B',
    date: '2025-03-01',
    seats: 3
  },
  {
    id: '2',
    driver: 'Jane Smith',
    from: 'City A',
    to: 'City C',
    date: '2025-03-02',
    seats: 2
  },
  {
    id: '3',
    driver: 'Alex Johnson',
    from: 'City D',
    to: 'City B',
    date: '2025-03-03',
    seats: 4
  }
];

export default function FindRide({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRides, setFilteredRides] = useState(ridesData);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRides(ridesData);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = ridesData.filter(
        ride =>
          ride.from.toLowerCase().includes(lowerQuery) ||
          ride.to.toLowerCase().includes(lowerQuery)
      );
      setFilteredRides(filtered);
    }
  }, [searchQuery]);

  const renderRideItem = ({ item }) => (
    <TouchableOpacity style={styles.rideCard} onPress={() => {
      // Optionally, navigate to a detailed ride screen
      // navigation.navigate('RideDetails', { rideId: item.id });
    }}>
      <Text style={styles.driverName}>Driver: {item.driver}</Text>
      <Text>From: {item.from}</Text>
      <Text>To: {item.to}</Text>
      <Text>Date: {item.date}</Text>
      <Text>Available Seats: {item.seats}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Ride</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by origin or destination"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Ride List */}
      <FlatList
        data={filteredRides}
        keyExtractor={item => item.id}
        renderItem={renderRideItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No rides found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#f9f9f9'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
    elevation: 2
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 16
  },
  listContainer: {
    paddingBottom: 20
  },
  rideCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007bff'
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20
  }
});
