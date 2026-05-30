import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';

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
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);

  // Track the month currently visible in the calendar grid
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Toggle Month-Year picker mode
  const [showPickerGrid, setShowPickerGrid] = useState(false);

  // Animation values for month switching
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Sync state when modal visibility triggers
  useEffect(() => {
    if (visible) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      setSelectedStart(start);
      setSelectedEnd(end);
      setCurrentDate(start ? new Date(start) : new Date());
      setShowPickerGrid(false);
    }
  }, [visible, startDate, endDate]);

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

  const animateMonthChange = (direction: 'next' | 'prev') => {
    fadeAnim.setValue(0.3);
    slideAnim.setValue(direction === 'next' ? 12 : -12);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    animateMonthChange('prev');
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    animateMonthChange('next');
  };

  const formatDateString = (date: Date) => {
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(year, month, day);
    return dateObj < today;
  };

  const handleDayPress = (day: number) => {
    if (isPast(day)) return;

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

  const applyPreset = (preset: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start: Date;
    let end: Date;

    if (preset === 'This Weekend') {
      const day = today.getDay(); // 0 is Sun, 6 is Sat
      start = new Date(today);
      end = new Date(today);
      
      // Calculate diff to upcoming Friday
      let diffToFri = 5 - day;
      if (day === 0) diffToFri = -2; // Select current/previous Friday
      if (day === 6) diffToFri = -1; // Select current/previous Friday
      
      // If it is Monday-Thursday, go to next Friday. Otherwise stick to this weekend.
      if (day >= 1 && day <= 4) {
        start.setDate(today.getDate() + (5 - day));
        end.setDate(today.getDate() + (7 - day));
      } else {
        start.setDate(today.getDate() + diffToFri);
        end.setDate(start.getDate() + 2);
      }
    } else if (preset === '1 Week') {
      start = new Date(today);
      end = new Date(today);
      end.setDate(start.getDate() + 7);
    } else { // 2 Weeks
      start = new Date(today);
      end = new Date(today);
      end.setDate(start.getDate() + 14);
    }

    setSelectedStart(start);
    setSelectedEnd(end);
    setCurrentDate(new Date(start.getFullYear(), start.getMonth(), 1));
    animateMonthChange('next');
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

  const handleSelectMonth = (mIdx: number) => {
    setCurrentDate(new Date(year, mIdx, 1));
  };

  const handleSelectYear = (y: number) => {
    setCurrentDate(new Date(y, month, 1));
  };

  // Format date helper for bottom selection card
  const formatSummaryDate = (date: Date) => {
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthsShort[date.getMonth()]} ${date.getDate()} (${daysShort[date.getDay()]})`;
  };

  const getDurationText = () => {
    if (!selectedStart) return 'Select start date';
    if (!selectedEnd) {
      return `Selected Start: ${formatSummaryDate(selectedStart)}`;
    }
    const diffTime = selectedEnd.getTime() - selectedStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `✈️ 1 day (Same day)`;
    }
    return `✈️ ${diffDays + 1} days (${diffDays} ${diffDays === 1 ? 'night' : 'nights'})`;
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
              width: '14.28%',
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
    const cells = [];
    
    // Add pre-padding cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(
        <View
          key={`pad-${i}`}
          style={{
            width: '14.28%',
            height: 42,
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
      const past = isPast(d);

      let cellBg = 'transparent';
      let borderTopLeftRad = 20;
      let borderBottomLeftRad = 20;
      let borderTopRightRad = 20;
      let borderBottomRightRad = 20;

      if (active) {
        cellBg = t.primary;
        if (selectedStart && selectedEnd) {
          if (isStart) {
            borderTopRightRad = 0;
            borderBottomRightRad = 0;
          }
          if (isEnd) {
            borderTopLeftRad = 0;
            borderBottomLeftRad = 0;
          }
        }
      } else if (inRange) {
        // High-end range highlighting style (light overlay)
        cellBg = phase === 'morning' ? 'rgba(15, 118, 110, 0.08)' : 'rgba(34, 211, 197, 0.12)';
        
        // Custom borders for range items to make it a connected track
        borderTopLeftRad = 0;
        borderBottomLeftRad = 0;
        borderTopRightRad = 0;
        borderBottomRightRad = 0;
      }

      cells.push(
        <TouchableOpacity
          key={`day-${d}`}
          onPress={() => handleDayPress(d)}
          disabled={past}
          activeOpacity={0.7}
          style={{
            width: '14.28%',
            height: 42,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: cellBg,
            borderTopLeftRadius: borderTopLeftRad,
            borderBottomLeftRadius: borderBottomLeftRad,
            borderTopRightRadius: borderTopRightRad,
            borderBottomRightRadius: borderBottomRightRad,
            marginVertical: 2,
          }}
        >
          <Text
            style={{
              color: active ? t.btnPrimaryText : inRange ? t.primary : past ? t.textMuted : t.text,
              fontSize: 14,
              fontWeight: active || inRange ? '800' : '500',
              opacity: past ? 0.25 : 1,
            }}
          >
            {d}
          </Text>
          {today && !active && (
            <View
              style={{
                position: 'absolute',
                bottom: 4,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: t.primary,
              }}
            />
          )}
        </TouchableOpacity>
      );
    }

    // Chunk cells into rows of 7
    const rows: React.ReactNode[][] = [];
    let currentRow: React.ReactNode[] = [];
    
    cells.forEach((cell) => {
      currentRow.push(cell);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    });

    // Add post-padding cells if the last row is not full
    if (currentRow.length > 0) {
      const remaining = 7 - currentRow.length;
      for (let i = 0; i < remaining; i++) {
        currentRow.push(
          <View
            key={`post-pad-${i}`}
            style={{
              width: '14.28%',
              height: 42,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          />
        );
      }
      rows.push(currentRow);
    }

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        {rows.map((row, index) => (
          <View
            key={`row-${index}`}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            {row}
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderMonthYearPicker = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y <= currentYear + 4; y++) {
      years.push(y);
    }

    return (
      <View style={{ paddingVertical: 10 }}>
        {/* Month Title */}
        <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Select Month
        </Text>

        {/* Months Grid (3x4) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', marginBottom: 20 }}>
          {MONTHS.map((mName, idx) => {
            const isSelectedMonth = idx === month;
            return (
              <TouchableOpacity
                key={mName}
                onPress={() => handleSelectMonth(idx)}
                style={{
                  width: '31%',
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isSelectedMonth ? t.primary : t.panelBgAlt,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isSelectedMonth ? t.primary : t.border,
                }}
              >
                <Text
                  style={{
                    color: isSelectedMonth ? t.btnPrimaryText : t.text,
                    fontWeight: isSelectedMonth ? '800' : '600',
                    fontSize: 13,
                  }}
                >
                  {mName.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Year Title */}
        <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Select Year
        </Text>
        
        {/* Years Selection Row */}
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'space-between', marginBottom: 24 }}>
          {years.map((y) => {
            const isSelectedYear = y === year;
            return (
              <TouchableOpacity
                key={y}
                onPress={() => handleSelectYear(y)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isSelectedYear ? t.primary : t.panelBgAlt,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isSelectedYear ? t.primary : t.border,
                }}
              >
                <Text
                  style={{
                    color: isSelectedYear ? t.btnPrimaryText : t.text,
                    fontWeight: isSelectedYear ? '800' : '600',
                    fontSize: 13,
                  }}
                >
                  {y}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Done Button to Toggle Back */}
        <TouchableOpacity
          onPress={() => setShowPickerGrid(false)}
          style={{
            backgroundColor: t.btnPrimary,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: t.btnPrimaryText, fontWeight: '800', fontSize: 15 }}>
            Done Selection
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: t.panelBg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: t.border,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          {/* Header Month Navigation */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <TouchableOpacity 
              onPress={handlePrevMonth} 
              disabled={showPickerGrid}
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 18, 
                backgroundColor: t.panelBgAlt, 
                borderWidth: 1, 
                borderColor: t.border, 
                justifyContent: 'center', 
                alignItems: 'center',
                opacity: showPickerGrid ? 0.3 : 1 
              }}
            >
              <Ionicons name="chevron-back" size={18} color={t.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowPickerGrid(!showPickerGrid)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: showPickerGrid ? t.ambientBg : 'transparent',
              }}
            >
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>
                {MONTHS[month]} {year}
              </Text>
              <Ionicons 
                name={showPickerGrid ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={showPickerGrid ? t.ambientText : t.textMuted} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleNextMonth} 
              disabled={showPickerGrid}
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 18, 
                backgroundColor: t.panelBgAlt, 
                borderWidth: 1, 
                borderColor: t.border, 
                justifyContent: 'center', 
                alignItems: 'center',
                opacity: showPickerGrid ? 0.3 : 1
              }}
            >
              <Ionicons name="chevron-forward" size={18} color={t.text} />
            </TouchableOpacity>
          </View>

          {/* Preset Buttons - Shown only in Day Grid Mode */}
          {!showPickerGrid && (
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
              {['This Weekend', '1 Week', '2 Weeks'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => applyPreset(preset)}
                  style={{
                    flex: 1,
                    backgroundColor: t.panelBgAlt,
                    borderRadius: 12,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Text style={{ color: t.primary, fontSize: 12, fontWeight: '700' }}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Grid Render or Selector */}
          {showPickerGrid ? (
            renderMonthYearPicker()
          ) : (
            <>
              {renderWeekHeaders()}
              {renderDays()}

              {/* Live Selection Summary Badge */}
              <View 
                style={{ 
                  backgroundColor: t.ambientBg, 
                  borderRadius: 14, 
                  borderWidth: 1, 
                  borderColor: t.ambientBorder,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  marginTop: 18,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: t.ambientText, fontWeight: '700', fontSize: 13 }}>
                  {getDurationText()}
                </Text>
                {selectedStart && selectedEnd && (
                  <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                    {formatSummaryDate(selectedStart)} — {formatSummaryDate(selectedEnd)}
                  </Text>
                )}
              </View>

              {/* Selection Labels */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: t.border,
                }}
              >
                <View>
                  <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>START DATE</Text>
                  <Text style={{ color: t.text, fontSize: 13, fontWeight: '800', marginTop: 2 }}>
                    {selectedStart ? formatDateString(selectedStart) : 'Select Start'}
                  </Text>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>END DATE</Text>
                  <Text style={{ color: t.text, fontSize: 13, fontWeight: '800', marginTop: 2 }}>
                    {selectedEnd ? formatDateString(selectedEnd) : 'Select End'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
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
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
