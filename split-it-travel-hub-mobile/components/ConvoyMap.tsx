import React from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface Vehicle {
  id: string;
  trip_id: string;
  vehicle_name: string;
  driver_name: string;
  capacity: number;
  passengers: string[];
  emoji: string;
}

interface ConvoyMapProps {
  vehicles: Vehicle[];
  location: any;
  theme: any;
}

export default function ConvoyMap({ vehicles, location, theme }: ConvoyMapProps) {
  const initialLat = location?.coords?.latitude || 28.6139;
  const initialLng = location?.coords?.longitude || 77.2090;

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: initialLat,
        longitude: initialLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={true}
    >
      {vehicles.map((v, i) => (
        <Marker
          key={v.id}
          coordinate={{
            latitude: initialLat + (i * 0.005),
            longitude: initialLng + (i * 0.005),
          }}
          title={v.vehicle_name}
          description={`Driver: ${v.driver_name}`}
        >
          <View
            style={{
              backgroundColor: theme.panelBg,
              padding: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            }}
          >
            <Text style={{ fontSize: 20 }}>{v.emoji}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}
