import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onSelectRange: (start: string, end: string) => void;
}

export default function CalendarPickerModal({
  visible,
  onClose,
  startDate,
  endDate,
  onSelectRange,
}: CalendarPickerModalProps) {
  const { phase } = useSkyTheme();
  const t = THEME[phase];

  // Initialize selected dates based on props
  const [selectedStart, setSelectedStart] = useState<Date | null>(
    startDate ? new Date(startDate) : null
  );
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(
    endDate ? new Date(endDate) : null
  );

  // Track the month currently visible in the calendar grid
  const [currentDate, setCurrentDate] = useState(
    startDate ? new Date(startDate) : new Date()
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month names
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar grid array
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getStartDayOfWeek = (y: number, m: number) => {
    // 0 = Sunday, 1 = Monday, etc. Adjusting Sunday to 6 (so Mon is 0, Sun is 6)
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const startDayOfWeek = getStartDayOfWeek(year, month);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDateString = (date: Date) => {
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  };

  const handleDayPress = (day: number) => {
    const dateObj = new Date(year, month, day);

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(dateObj);
      setSelectedEnd(null);
    } else {
      if (dateObj < selectedStart) {
        setSelectedStart(dateObj);
      } else {
        setSelectedEnd(dateObj);
      }
    }
  };

  const handleApply = () => {
    if (selectedStart && selectedEnd) {
      onSelectRange(formatDateString(selectedStart), formatDateString(selectedEnd));
    } else if (selectedStart) {
      onSelectRange(formatDateString(selectedStart), formatDateString(selectedStart));
    }
    onClose();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number) => {
    const dateObj = new Date(year, month, day);
    const startStr = selectedStart ? formatDateString(selectedStart) : '';
    const endStr = selectedEnd ? formatDateString(selectedEnd) : '';
    const currentStr = formatDateString(dateObj);

    return currentStr === startStr || currentStr === endStr;
  };

  const isInRange = (day: number) => {
    if (!selectedStart || !selectedEnd) return false;
    const dateObj = new Date(year, month, day);
    return dateObj > selectedStart && dateObj < selectedEnd;
  };

  // Render Weekday headers
  const renderWeekHeaders = () => {
    const headers = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
        {headers.map((h, i) => (
          <Text
            key={i}
            style={{
              color: t.textMuted,
              fontWeight: '700',
              fontSize: 12,
              width: (SCREEN_W - 80) / 7,
              textAlign: 'center',
            }}
          >
            {h}
          </Text>
        ))}
      </View>
    );
  };

  // Render Month Day grid
  const renderDays = () => {
    const grid = [];
    
    // Add pre-padding cells
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(
        <View
          key={`pad-${i}`}
          style={{
            width: (SCREEN_W - 80) / 7,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
      );
    }

    // Add actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const active = isSelected(d);
      const inRange = isInRange(d);
      const isStart = selectedStart && formatDateString(new Date(year, month, d)) === formatDateString(selectedStart);
      const isEnd = selectedEnd && formatDateString(new Date(year, month, d)) === formatDateString(selectedEnd);
      const today = isToday(d);

      let cellBg = 'transparent';
      let borderRad = 20;

      if (active) {
        cellBg = t.primary;
      } else if (inRange) {
        // High-end range highlighting style (light overlay)
        cellBg = phase === 'morning' ? 'rgba(15, 118, 110, 0.12)' : 'rgba(183, 121, 31, 0.12)';
        
        // Custom borders for range items to make it a connected track
        borderRad = 0;
      }

      grid.push(
        <TouchableOpacity
          key={`day-${d}`}
          onPress={() => handleDayPress(d)}
          style={{
            width: (SCREEN_W - 80) / 7,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: cellBg,
            borderRadius: borderRad,
            borderWidth: today && !active ? 1 : 0,
            borderColor: t.primary,
            borderTopLeftRadius: isStart ? 20 : borderRad,
            borderBottomLeftRadius: isStart ? 20 : borderRad,
            borderTopRightRadius: isEnd ? 20 : borderRad,
            borderBottomRightRadius: isEnd ? 20 : borderRad,
            marginVertical: 2,
          }}
        >
          <Text
            style={{
              color: active ? '#FFFFFF' : inRange ? t.primary : t.text,
              fontSize: 14,
              fontWeight: active || inRange ? '800' : '500',
            }}
          >
            {d}
          </Text>
        </TouchableOpacity>
      );
    }

    return <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{grid}</View>;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            width: '100%',
            backgroundColor: t.panelBg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: t.border,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
          }}
        >
          {/* Header Month Navigation */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 6 }}>
              <Ionicons name="chevron-back" size={20} color={t.text} />
            </TouchableOpacity>
            
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>
              {MONTHS[month]} {year}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={{ padding: 6 }}>
              <Ionicons name="chevron-forward" size={20} color={t.text} />
            </TouchableOpacity>
          </View>

          {/* Grid Render */}
          {renderWeekHeaders()}
          {renderDays()}

          {/* Selection Labels */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 20,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: t.border,
            }}
          >
            <View>
              <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '700' }}>START DATE</Text>
              <Text style={{ color: t.text, fontSize: 13, fontWeight: '800', marginTop: 2 }}>
                {selectedStart ? formatDateString(selectedStart) : 'Select Start'}
              </Text>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '700' }}>END DATE</Text>
              <Text style={{ color: t.text, fontSize: 13, fontWeight: '800', marginTop: 2 }}>
                {selectedEnd ? formatDateString(selectedEnd) : 'Select End'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: t.panelBgAlt,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <Text style={{ color: t.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleApply}
              style={{
                flex: 2,
                backgroundColor: t.btnPrimary,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: t.btnPrimaryText, fontWeight: '800' }}>Apply Dates</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
