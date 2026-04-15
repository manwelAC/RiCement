# Dispensing Architecture - ESPBLUE.ino

## Overview

The ESPBLUE.ino controller manages three independent dispensers (Cement, RHA, and Water Pump) through a coordinated dispensing system that operates in two modes: **Auto Mode** and **Manual Mode**.

---

## Core Dispensing Functions

### 1. `startAutoSequence()`

**Purpose**: Initiates the automatic dispensing cycle when `timerActive` flag is set to true.

**Behavior**:

- Activates all three dispensers simultaneously
- Sets `autoModeActive = true`
- Records the start time via `autoStartTime = millis()`
- Opens cement servo to 180°
- Opens RHA servo to 180°
- Turns water pump to full power (255)

**Code Location**: Lines 281-289

```cpp
void startAutoSequence() {
  Serial.println("\n🎯 AUTO SEQUENCE STARTED (timerActive = true)");
  autoModeActive = true;
  autoStartTime = millis();
  setCement(true, "auto");
  setRHA(true, "auto");
  setWaterPump(true, "auto");
}
```

---

### 2. `updateAutoSequence()`

**Purpose**: Monitors the auto sequence timer and stops dispensing after 8 seconds.

**Behavior**:

- Calculates elapsed time since `startAutoSequence()` was called
- When 8 seconds (`AUTO_TIME_MS = 8000ms`) have passed:
  - Closes cement servo (if `cementManualState` is true)
  - Closes RHA servo (if `rhaManualState` is true)
  - Stops water pump
  - Sets `autoModeActive = false`
  - Prints completion message

**Code Location**: Lines 294-309

```cpp
void updateAutoSequence() {
  if (!autoModeActive) return;
  unsigned long elapsed = millis() - autoStartTime;
  if (elapsed >= AUTO_TIME_MS) {
    if (cementManualState) setCement(false, "auto");
    if (rhaManualState) setRHA(false, "auto");
    if (waterPumpState) setWaterPump(false, "auto");
    Serial.println("\n✅ AUTO SEQUENCE COMPLETED");
    autoModeActive = false;
  }
}
```

**Called From**: Main loop (line ~550)

---

### 3. `setCement(bool state, String source)`

**Purpose**: Controls the cement servo valve independently.

**Hardware**:

- GPIO Pin: 32
- Servo Range: 0° (closed) to 180° (open)

**Parameters**:

- `state`: true = OPEN (180°), false = CLOSE (0°)
- `source`: "auto", "firestore", or "manual" (for logging)

**Code Location**: Lines 314-330

---

### 4. `setRHA(bool state, String source)`

**Purpose**: Controls the RHA (Rice Husk Ash) servo valve independently.

**Hardware**:

- GPIO Pin: 4
- Servo Range: 0° (closed) to 180° (open)

**Parameters**:

- `state`: true = OPEN (180°), false = CLOSE (0°)
- `source`: "auto", "firestore", or "manual" (for logging)

**Code Location**: Lines 335-351

---

### 5. `setWaterPump(bool state, String source)`

**Purpose**: Controls the water pump motor via PWM and relay pins.

**Hardware**:

- RPWM (PWM Speed): GPIO 21
- REN (Enable reverse): GPIO 22
- LEN (Enable reverse): GPIO 23
- Full Power: PWM value 255

**On State**:

- Sets REN and LEN to HIGH
- Sets RPWM to 255 (full speed)

**Off State**:

- Sets RPWM to 0
- Sets REN and LEN to LOW

**Code Location**: Lines 356-379

---

## Control Flow Diagram

```
MAIN LOOP
    ↓
checkFirestore()
    ├─ Check timerActive flag
    │   ├─ If TRUE & autoModeActive == FALSE → startAutoSequence()
    │   └─ If FALSE & autoModeActive == TRUE → Stop all + Return to manual
    │
    └─ Check individual dispenser flags (if NOT in auto mode)
        ├─ dispense_cement → setCement()
        ├─ dispense_rha → setRHA()
        └─ dispense_water → setWaterPump()

updateAutoSequence() (runs every loop iteration if autoModeActive)
    └─ Elapsed time ≥ 8s? → Stop all dispensers
```

---

## Mode Selection Logic

### Auto Mode (Synchronized Dispensing)

- **Trigger**: `timerActive = true` in Firestore `manual_projects` collection
- **Behavior**: All three dispensers run for exactly **8 seconds**
- **Priority**: Auto mode overrides manual controls
- **Stop Condition**: 8 seconds elapsed OR `timerActive = false`

### Manual Mode (Independent Control)

- **Triggers**: Individual Firestore flags (`dispense_cement`, `dispense_rha`, `dispense_water`)
- **Behavior**: Each dispenser controlled independently
- **Duration**: Controlled by Firestore flag state (no automatic timeout)
- **Enabled When**: `autoModeActive = false`

---

## Timing Constants

| Constant           | Value | Purpose                               |
| ------------------ | ----- | ------------------------------------- |
| `AUTO_TIME_MS`     | 8000  | Duration of auto sequence (8 seconds) |
| `CHECK_INTERVAL`   | 1000  | Firestore update check frequency      |
| `DISPLAY_INTERVAL` | 1000  | Serial status display update rate     |
| `SENSOR_INTERVAL`  | 1000  | Distance sensor reading frequency     |

---

## State Variables

| Variable               | Type          | Purpose                                             |
| ---------------------- | ------------- | --------------------------------------------------- |
| `autoModeActive`       | bool          | Tracks if auto sequence is running                  |
| `autoStartTime`        | unsigned long | Timestamp when auto mode started                    |
| `cementManualState`    | bool          | Current cement dispenser state                      |
| `rhaManualState`       | bool          | Current RHA dispenser state                         |
| `waterPumpState`       | bool          | Current water pump state                            |
| `timerActiveFirestore` | bool          | Current `timerActive` flag from Firestore           |
| `lastTimerActive`      | bool          | Previous `timerActive` state (for change detection) |

---

## Emergency Stop

**Function**: `stopAllDispensers()`

- Closes all valves immediately
- Stops water pump
- Disables auto mode
- Triggered by: Serial command 's' or 'S'

---

## Testing

**Function**: `testAllDispensers()`

- Opens cement for 2 seconds
- 0.5 second pause
- Opens RHA for 2 seconds
- Opens water pump for 2 seconds
- Triggered by: Serial command 't' or 'T'

---

## Serial Commands

| Command    | Action                           |
| ---------- | -------------------------------- |
| `t` or `T` | Test all dispensers sequentially |
| `s` or `S` | Emergency stop all dispensers    |

---

## Related Systems

### Distance Sensors

- **Cement Sensor (VL53L0X)**: SCL 27, SDA 25 → Measures cement tank level
- **RHA Sensor (VL53L0X)**: SCL 17, SDA 19 → Measures RHA tank level
- **Calibration**: 30mm = 0%, 70mm = 100%
- Sensor data uploaded to Firebase RTDB in real-time

### Firestore Integration

- **Collection**: `manual_controller` (manual control flags)
- **Collection**: `manual_projects` (timerActive flag)
- **Query Interval**: 1000ms

---

## Notes for Future Adjustments

1. **To modify auto sequence duration**: Change `AUTO_TIME_MS` constant (currently 8000ms)
2. **To add sequential dispensing**: Modify `startAutoSequence()` and `updateAutoSequence()` with state machine
3. **To add per-dispenser timing**: Track separate start times for cement, RHA, and water
4. **To add PWM speed control**: Modify `setWaterPump()` to accept speed parameter instead of just bool
