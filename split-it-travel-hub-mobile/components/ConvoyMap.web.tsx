import React from 'react';
import { View, Text } from 'react-native';

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
  const activeLocation = "Lonavala, Maharashtra, India";
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(activeLocation)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.panelBgAlt, justifyContent: 'center', alignItems: 'center' }}>
      {/* On web, we render an embedded Google Map frame */}
      <iframe
        src={mapEmbedUrl}
        width="100%"
        height="100%"
        style={{ border: 0, width: '100%', height: '100%', minHeight: '200px' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </View>
  );
}
