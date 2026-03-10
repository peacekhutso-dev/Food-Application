import { MapPin, User, Phone, Clock, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';

import './styles/pickupform.css';


const PickupForm = ({ deliveryInfo, onInputChange, onPickupTimeChange }) => {
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    generateTimeSlots();
  }, []);

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const closingHour = 17; // 5:00 PM

    let startHour = currentHour;
    let startMinute = currentMinute + 30;

    if (startMinute >= 60) {
      startHour += 1;
      startMinute = startMinute - 60;
    }

    if (startMinute > 0 && startMinute <= 30) {
      startMinute = 30;
    } else if (startMinute > 30) {
      startHour += 1;
      startMinute = 0;
    }

    if (startHour >= closingHour) {
      slots.push({
        value: 'closed',
        label: 'Store closed - Please come back tomorrow',
        disabled: true
      });
      setAvailableTimeSlots(slots);
      return;
    }

    let hour = startHour;
    let minute = startMinute;

    while (hour < closingHour || (hour === closingHour && minute === 0)) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = formatTime(hour, minute);

      slots.push({
        value: timeString,
        label: displayTime,
        disabled: false
      });

      minute += 30;
      if (minute >= 60) {
        hour += 1;
        minute = 0;
      }

      if (hour >= closingHour) {
        break;
      }
    }

    if (slots.length === 0) {
      slots.push({
        value: 'closed',
        label: 'No pickup times available today',
        disabled: true
      });
    }

    setAvailableTimeSlots(slots);
  };

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  return (
    <div className="pickup-form-section">
      <div className="pickup-form-header">
        <MapPin size={20} strokeWidth={2.5} />
        <h2>Pickup Information</h2>
      </div>

      <div className="pickup-form-grid">
        {/* Full Name */}
        <div className={`form-field ${focused === 'fullName' ? 'focused' : ''} ${deliveryInfo.fullName ? 'filled' : ''}`}>
          <label>
            <User size={16} strokeWidth={2.5} />
            <span>Full Name</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={deliveryInfo.fullName}
            onChange={onInputChange}
            onFocus={() => setFocused('fullName')}
            onBlur={() => setFocused(null)}
            placeholder="John Doe"
            required
          />
        </div>

        {/* Phone Number */}
        <div className={`form-field ${focused === 'phone' ? 'focused' : ''} ${deliveryInfo.phone ? 'filled' : ''}`}>
          <label>
            <Phone size={16} strokeWidth={2.5} />
            <span>Phone Number</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={deliveryInfo.phone}
            onChange={onInputChange}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            placeholder="+27 12 345 6789"
            required
          />
        </div>

        {/* Pickup Time */}
        <div className={`form-field full-width ${focused === 'pickupTime' ? 'focused' : ''} ${deliveryInfo.pickupTime ? 'filled' : ''}`}>
          <label>
            <Clock size={16} strokeWidth={2.5} />
            <span>Pickup Time</span>
          </label>
          <div className="select-wrapper">
            <select
              name="pickupTime"
              value={deliveryInfo.pickupTime || ''}
              onChange={onPickupTimeChange}
              onFocus={() => setFocused('pickupTime')}
              onBlur={() => setFocused(null)}
              required
            >
              <option value="" disabled>Select pickup time</option>
              {availableTimeSlots.map((slot, index) => (
                <option
                  key={index}
                  value={slot.value}
                  disabled={slot.disabled}
                >
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
          <div className="store-hours">
            <Clock size={14} strokeWidth={2.5} />
            <span>Store hours: 8:00 AM - 5:00 PM</span>
          </div>
        </div>

        {/* Special Instructions */}
        <div className={`form-field full-width ${focused === 'instructions' ? 'focused' : ''} ${deliveryInfo.instructions ? 'filled' : ''}`}>
          <label>
            <MessageSquare size={16} strokeWidth={2.5} />
            <span>Special Instructions</span>
            <span className="optional-tag">Optional</span>
          </label>
          <textarea
            name="instructions"
            value={deliveryInfo.instructions}
            onChange={onInputChange}
            onFocus={() => setFocused('instructions')}
            onBlur={() => setFocused(null)}
            placeholder="Any special requests for your order..."
            rows="3"
          />
        </div>
      </div>
    </div>
  );
};

export default PickupForm;