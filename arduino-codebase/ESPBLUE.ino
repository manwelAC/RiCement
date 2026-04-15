/*
 * 2-DISPENSER CONTROLLER (CEMENT + RHA + WATER PUMP)
 *
 * AUTO MODE (timerActive = true):
 *   - Cement: 8 seconds
 *   - RHA:    8 seconds
 *   - Water:  8 seconds
 *   Lahat sabay-sabay tatakbo
 *
 * MANUAL MODE:
 *   - dispense_cement / dispense_rha / dispense_water
 *   - true = OPEN, false = CLOSE
 *
 * Cement Servo: GPIO 32
 * RHA Servo:    GPIO 4
 * Water Pump:   RPWM 21, REN 22, LEN 23
 *
 * VL53L0X #1 (Cement): SCL 12, SDA 13 -> sensor_1
 * VL53L0X #2 (RHA):    SCL 17, SDA 19 -> sensor_2
 *
 * Sensor Percentage Mapping:
 *   - 0%   = 30mm
 *   - 100% = 70mm
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <VL53L0X.h>

// ----------------- WiFi Configuration -----------------
#define WIFI_SSID "ricementhp"
#define WIFI_PASS "123456789"
#define WIFI_LED_PIN 25

// ----------------- Firebase Firestore Configuration -----------------
#define FIREBASE_PROJECT_ID "ricement-app"
#define FIRESTORE_URL "https://firestore.googleapis.com/v1/projects/" FIREBASE_PROJECT_ID "/databases/(default)/documents:runQuery"

// ----------------- Firebase Realtime Database -----------------
#define FIREBASE_RTDB_URL "https://ricement-app-default-rtdb.asia-southeast1.firebasedatabase.app"

// ----------------- PINOUT -----------------
#define CEMENT_SERVO_PIN 32
#define RHA_SERVO_PIN 4
#define WATER_PUMP_RPWM 21
#define WATER_PUMP_REN 22
#define WATER_PUMP_LEN 23

// VL53L0X (Cement)
#define CEMENT_SENSOR_SCL 27
#define CEMENT_SENSOR_SDA 25

// VL53L0X (RHA)
#define RHA_SENSOR_SCL 17
#define RHA_SENSOR_SDA 19

// ----------------- Servo Settings -----------------
const int SERVO_OPEN = 180;
const int SERVO_CLOSE = 0;

// ----------------- AUTO Timing -----------------
const unsigned long AUTO_TIME_MS = 8000;

// ----------------- Timing -----------------
const unsigned long CHECK_INTERVAL = 1000;
const unsigned long DISPLAY_INTERVAL = 1000;
const unsigned long SENSOR_INTERVAL = 1000;

// ----------------- Sensor Calibration -----------------
const int SENSOR_MM_0_PERCENT = 30;
const int SENSOR_MM_100_PERCENT = 70;

// ----------------- Objects -----------------
Servo cementServo;
Servo rhaServo;

TwoWire i2cCement = TwoWire(0);
TwoWire i2cRha = TwoWire(1);
VL53L0X sensorCement;
VL53L0X sensorRha;

// ----------------- Variables -----------------
bool cementFirestore = false;
bool rhaFirestore = false;
bool waterFirestore = false;
bool timerActiveFirestore = false;

bool lastCement = false;
bool lastRHA = false;
bool lastWater = false;
bool lastTimerActive = false;

bool autoModeActive = false;
unsigned long autoStartTime = 0;

bool cementManualState = false;
bool rhaManualState = false;
bool waterPumpState = false;

bool cementSensorReady = false;
bool rhaSensorReady = false;
int cementDistanceMm = 0;
int rhaDistanceMm = 0;
int cementPercent = 0;
int rhaPercent = 0;

unsigned long lastFirestoreCheck = 0;
unsigned long lastDisplay = 0;
unsigned long lastSensorRead = 0;

// ----------------- Function Declarations -----------------
void connectWiFi();
void updateWiFiLED();
bool checkFieldStatus(String fieldName);
bool checkTimerActive();
void checkFirestore();
void startAutoSequence();
void updateAutoSequence();
void setCement(bool state, String source);
void setRHA(bool state, String source);
void setWaterPump(bool state, String source);
void stopAllDispensers();
void showStatus();
void testAllDispensers();
void handleSerialCommands();
void initDistanceSensors();
int percentageFromMm(int distanceMm);
void updateAndUploadSensors();
void uploadSensorData(const String& sensorKey, int distanceMm, int percent);

// ----------------- SETUP -----------------
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║   2-DISPENSER CONTROLLER v6.0      ║");
  Serial.println("╠════════════════════════════════════╣");
  Serial.println("║ Cement (180°): GPIO 32             ║");
  Serial.println("║ RHA    (180°): GPIO 4              ║");
  Serial.println("║ Water  (Pump): RPWM 21             ║");
  Serial.println("║ VL53 CEM   : SCL12 SDA13           ║");
  Serial.println("║ VL53 RHA   : SCL17 SDA19           ║");
  Serial.println("╠════════════════════════════════════╣");
  Serial.println("║ AUTO MODE (timerActive = true):    ║");
  Serial.println("║ Cement + RHA + Water = 8 seconds   ║");
  Serial.println("╠════════════════════════════════════╣");
  Serial.println("║ MANUAL: dispense_cement/rha/water  ║");
  Serial.println("╚════════════════════════════════════╝\n");

  pinMode(WIFI_LED_PIN, OUTPUT);
  digitalWrite(WIFI_LED_PIN, HIGH);

  cementServo.attach(CEMENT_SERVO_PIN);
  rhaServo.attach(RHA_SERVO_PIN);
  cementServo.write(SERVO_CLOSE);
  rhaServo.write(SERVO_CLOSE);

  pinMode(WATER_PUMP_RPWM, OUTPUT);
  pinMode(WATER_PUMP_REN, OUTPUT);
  pinMode(WATER_PUMP_LEN, OUTPUT);
  digitalWrite(WATER_PUMP_REN, LOW);
  digitalWrite(WATER_PUMP_LEN, LOW);
  analogWrite(WATER_PUMP_RPWM, 0);

  initDistanceSensors();
  connectWiFi();

  Serial.println("\n✅ System Ready!\n");
}

// ----------------- WiFi Connection -----------------
void connectWiFi() {
  Serial.print("📡 Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
    updateWiFiLED();
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
  } else {
    Serial.println("\n❌ WiFi Failed! Restarting...");
    delay(2000);
    ESP.restart();
  }
}

// ----------------- Update WiFi LED -----------------
void updateWiFiLED() {
  digitalWrite(WIFI_LED_PIN, WiFi.status() != WL_CONNECTED);
}

// ----------------- Check Firestore Field -----------------
bool checkFieldStatus(String fieldName) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;

  String query = "{";
  query += "\"structuredQuery\": {";
  query += "\"from\": [{\"collectionId\": \"manual_controller\"}],";
  query += "\"where\": {";
  query += "\"fieldFilter\": {";
  query += "\"field\": {\"fieldPath\": \"" + fieldName + "\"},";
  query += "\"op\": \"EQUAL\",";
  query += "\"value\": {\"booleanValue\": true}";
  query += "}";
  query += "},";
  query += "\"limit\": 1";
  query += "}";
  query += "}";

  http.begin(FIRESTORE_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(query);
  bool isActive = false;

  if (httpCode == 200) {
    String payload = http.getString();
    if (payload.indexOf("booleanValue") > 0 && payload.indexOf("true") > 0) {
      isActive = true;
    }
  }

  http.end();
  return isActive;
}

// ----------------- Check timerActive -----------------
bool checkTimerActive() {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;

  String query = "{";
  query += "\"structuredQuery\": {";
  query += "\"from\": [{\"collectionId\": \"manual_projects\"}],";
  query += "\"where\": {";
  query += "\"fieldFilter\": {";
  query += "\"field\": {\"fieldPath\": \"timerActive\"},";
  query += "\"op\": \"EQUAL\",";
  query += "\"value\": {\"booleanValue\": true}";
  query += "}";
  query += "},";
  query += "\"limit\": 1";
  query += "}";
  query += "}";

  http.begin(FIRESTORE_URL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(query);
  bool isActive = false;

  if (httpCode == 200) {
    String payload = http.getString();
    if (payload.indexOf("booleanValue") > 0 && payload.indexOf("true") > 0) {
      isActive = true;
    }
  }

  http.end();
  return isActive;
}

// ----------------- Check All Firestore -----------------
void checkFirestore() {
  if (WiFi.status() != WL_CONNECTED) return;

  bool timerNow = checkTimerActive();
  timerActiveFirestore = timerNow;

  if (timerNow != lastTimerActive) {
    if (timerNow && !autoModeActive) {
      startAutoSequence();
    } else if (!timerNow && autoModeActive) {
      autoModeActive = false;
      setCement(cementManualState, "manual");
      setRHA(rhaManualState, "manual");
      setWaterPump(false, "auto");
    }
    lastTimerActive = timerNow;
  }

  bool cementNow = checkFieldStatus("dispense_cement");
  bool rhaNow = checkFieldStatus("dispense_rha");
  bool waterNow = checkFieldStatus("dispense_water");

  if (!autoModeActive) {
    if (cementNow != lastCement) {
      cementManualState = cementNow;
      setCement(cementNow, "firestore");
    }

    if (rhaNow != lastRHA) {
      rhaManualState = rhaNow;
      setRHA(rhaNow, "firestore");
    }

    if (waterNow != lastWater) {
      setWaterPump(waterNow, "firestore");
    }
  }

  cementFirestore = cementNow;
  rhaFirestore = rhaNow;
  waterFirestore = waterNow;

  lastCement = cementNow;
  lastRHA = rhaNow;
  lastWater = waterNow;
}

// ----------------- Start AUTO Sequence -----------------
void startAutoSequence() {
  Serial.println("\n🎯 AUTO SEQUENCE STARTED (timerActive = true)");
  autoModeActive = true;
  autoStartTime = millis();

  setCement(true, "auto");
  setRHA(true, "auto");
  setWaterPump(true, "auto");
}

// ----------------- Update AUTO Sequence -----------------
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

// ----------------- Set Cement -----------------
void setCement(bool state, String source) {
  if (state) {
    cementServo.write(SERVO_OPEN);
    cementManualState = true;
    if (source == "auto") Serial.println("  → Cement OPEN (AUTO)");
    else if (source == "firestore") Serial.println("  → Cement OPEN (Firestore)");
    else Serial.println("  → Cement OPEN (Manual)");
  } else {
    cementServo.write(SERVO_CLOSE);
    cementManualState = false;
    if (source == "auto") Serial.println("  → Cement CLOSE (AUTO)");
    else if (source == "firestore") Serial.println("  → Cement CLOSE (Firestore)");
    else Serial.println("  → Cement CLOSE (Manual)");
  }
}

// ----------------- Set RHA -----------------
void setRHA(bool state, String source) {
  if (state) {
    rhaServo.write(SERVO_OPEN);
    rhaManualState = true;
    if (source == "auto") Serial.println("  → RHA OPEN (AUTO)");
    else if (source == "firestore") Serial.println("  → RHA OPEN (Firestore)");
    else Serial.println("  → RHA OPEN (Manual)");
  } else {
    rhaServo.write(SERVO_CLOSE);
    rhaManualState = false;
    if (source == "auto") Serial.println("  → RHA CLOSE (AUTO)");
    else if (source == "firestore") Serial.println("  → RHA CLOSE (Firestore)");
    else Serial.println("  → RHA CLOSE (Manual)");
  }
}

// ----------------- Set Water Pump -----------------
void setWaterPump(bool state, String source) {
  if (state) {
    digitalWrite(WATER_PUMP_REN, HIGH);
    digitalWrite(WATER_PUMP_LEN, HIGH);
    analogWrite(WATER_PUMP_RPWM, 255);
    waterPumpState = true;
    if (source == "auto") Serial.println("  → Water Pump ON (AUTO)");
    else if (source == "firestore") Serial.println("  → Water Pump ON (Firestore)");
    else Serial.println("  → Water Pump ON (Manual)");
  } else {
    analogWrite(WATER_PUMP_RPWM, 0);
    digitalWrite(WATER_PUMP_REN, LOW);
    digitalWrite(WATER_PUMP_LEN, LOW);
    waterPumpState = false;
    if (source == "auto") Serial.println("  → Water Pump OFF (AUTO)");
    else if (source == "firestore") Serial.println("  → Water Pump OFF (Firestore)");
    else Serial.println("  → Water Pump OFF (Manual)");
  }
}

// ----------------- Stop All Dispensers -----------------
void stopAllDispensers() {
  Serial.println("\n🛑 EMERGENCY STOP");
  setCement(false, "manual");
  setRHA(false, "manual");
  setWaterPump(false, "manual");
  autoModeActive = false;
}

// ----------------- Test All Dispensers -----------------
void testAllDispensers() {
  Serial.println("\n🔧 TESTING DISPENSERS");

  setCement(true, "manual");
  delay(2000);
  setCement(false, "manual");
  delay(500);

  setRHA(true, "manual");
  delay(2000);
  setRHA(false, "manual");

  setWaterPump(true, "manual");
  delay(2000);
  setWaterPump(false, "manual");

  Serial.println("✅ Test complete");
}

// ----------------- Distance Sensors -----------------
void initDistanceSensors() {
  i2cCement.begin(CEMENT_SENSOR_SDA, CEMENT_SENSOR_SCL, 100000);
  i2cRha.begin(RHA_SENSOR_SDA, RHA_SENSOR_SCL, 100000);

  sensorCement.setBus(&i2cCement);
  sensorRha.setBus(&i2cRha);

  sensorCement.setTimeout(200);
  sensorRha.setTimeout(200);

  cementSensorReady = sensorCement.init();
  if (cementSensorReady) {
    sensorCement.startContinuous(50);
    Serial.println("✅ VL53L0X Cement sensor ready");
  } else {
    Serial.println("❌ VL53L0X Cement sensor init failed");
  }

  rhaSensorReady = sensorRha.init();
  if (rhaSensorReady) {
    sensorRha.startContinuous(50);
    Serial.println("✅ VL53L0X RHA sensor ready");
  } else {
    Serial.println("❌ VL53L0X RHA sensor init failed");
  }
}

int percentageFromMm(int distanceMm) {
  if (distanceMm <= SENSOR_MM_0_PERCENT) return 0;
  if (distanceMm >= SENSOR_MM_100_PERCENT) return 100;

  float ratio = (float)(distanceMm - SENSOR_MM_0_PERCENT) /
                (float)(SENSOR_MM_100_PERCENT - SENSOR_MM_0_PERCENT);
  return (int)(ratio * 100.0f + 0.5f);
}

void updateAndUploadSensors() {
  if (cementSensorReady) {
    uint16_t mm = sensorCement.readRangeContinuousMillimeters();
    if (!sensorCement.timeoutOccurred()) {
      cementDistanceMm = (int)mm;
      cementPercent = percentageFromMm(cementDistanceMm);
      uploadSensorData("sensor_1", cementDistanceMm, cementPercent);
    }
  }

  if (rhaSensorReady) {
    uint16_t mm = sensorRha.readRangeContinuousMillimeters();
    if (!sensorRha.timeoutOccurred()) {
      rhaDistanceMm = (int)mm;
      rhaPercent = percentageFromMm(rhaDistanceMm);
      uploadSensorData("sensor_2", rhaDistanceMm, rhaPercent);
    }
  }
}

void uploadSensorData(const String& sensorKey, int distanceMm, int percent) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(FIREBASE_RTDB_URL) + "/sensor_data/sensors/" + sensorKey + ".json";

  String json = "{";
  json += "\"distance_cm\":" + String(distanceMm / 10.0f, 1) + ",";
  json += "\"distance_mm\":" + String(distanceMm) + ",";
  json += "\"distance_percent\":" + String(percent) + ",";
  json += "\"max_distance\":100";
  json += "}";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.PUT(json);

  if (code != 200 && code != 204) {
    Serial.print("⚠️ Upload failed ");
    Serial.print(sensorKey);
    Serial.print(" HTTP ");
    Serial.println(code);
  }

  http.end();
}

// ----------------- Status Display -----------------
void showStatus() {
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║         SYSTEM STATUS              ║");
  Serial.println("╠════════════════════════════════════╣");

  Serial.print("║ timerActive: ");
  Serial.print(timerActiveFirestore ? "ON" : "OFF");
  if (autoModeActive) Serial.print(" (AUTO RUNNING)");
  int spacing1 = 28 - (timerActiveFirestore ? 2 : 3) - (autoModeActive ? 14 : 0);
  for (int i = 0; i < spacing1; i++) Serial.print(" ");
  Serial.println("║");

  Serial.println("╠════════════════════════════════════╣");

  Serial.print("║ Cement (180°): ");
  if (cementManualState) {
    if (autoModeActive) {
      unsigned long elapsed = millis() - autoStartTime;
      unsigned long remaining = (elapsed >= AUTO_TIME_MS) ? 0 : (AUTO_TIME_MS - elapsed);
      Serial.print("ON (");
      Serial.print(remaining / 1000);
      Serial.print("s)");
      int spacing2 = 21 - String(remaining / 1000).length();
      for (int i = 0; i < spacing2; i++) Serial.print(" ");
    } else {
      Serial.print("ON               ");
    }
  } else {
    Serial.print("OFF              ");
  }
  Serial.println("║");

  Serial.print("║ RHA    (180°): ");
  if (rhaManualState) {
    if (autoModeActive) {
      unsigned long elapsed = millis() - autoStartTime;
      unsigned long remaining = (elapsed >= AUTO_TIME_MS) ? 0 : (AUTO_TIME_MS - elapsed);
      Serial.print("ON (");
      Serial.print(remaining / 1000);
      Serial.print("s)");
      int spacing3 = 21 - String(remaining / 1000).length();
      for (int i = 0; i < spacing3; i++) Serial.print(" ");
    } else {
      Serial.print("ON               ");
    }
  } else {
    Serial.print("OFF              ");
  }
  Serial.println("║");

  Serial.print("║ Water  (Pump): ");
  if (waterPumpState) {
    if (autoModeActive) {
      unsigned long elapsed = millis() - autoStartTime;
      unsigned long remaining = (elapsed >= AUTO_TIME_MS) ? 0 : (AUTO_TIME_MS - elapsed);
      Serial.print("ON (");
      Serial.print(remaining / 1000);
      Serial.print("s)");
      int spacing4 = 21 - String(remaining / 1000).length();
      for (int i = 0; i < spacing4; i++) Serial.print(" ");
    } else {
      Serial.print("ON               ");
    }
  } else {
    Serial.print("OFF              ");
  }
  Serial.println("║");

  Serial.print("║ Sensor 1 (CEM): ");
  Serial.print(cementPercent);
  Serial.print("% ");
  Serial.print(cementDistanceMm);
  Serial.print("mm");
  int spacing5 = 17 - String(cementPercent).length() - String(cementDistanceMm).length();
  if (spacing5 < 1) spacing5 = 1;
  for (int i = 0; i < spacing5; i++) Serial.print(" ");
  Serial.println("║");

  Serial.print("║ Sensor 2 (RHA): ");
  Serial.print(rhaPercent);
  Serial.print("% ");
  Serial.print(rhaDistanceMm);
  Serial.print("mm");
  int spacing6 = 17 - String(rhaPercent).length() - String(rhaDistanceMm).length();
  if (spacing6 < 1) spacing6 = 1;
  for (int i = 0; i < spacing6; i++) Serial.print(" ");
  Serial.println("║");

  Serial.println("╠════════════════════════════════════╣");

  Serial.print("║ WiFi: ");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected (");
    Serial.print(WiFi.RSSI());
    Serial.print(" dBm)");
    int spacing7 = 19 - String(WiFi.RSSI()).length();
    for (int i = 0; i < spacing7; i++) Serial.print(" ");
    Serial.println("║");
  } else {
    Serial.println("Disconnected              ║");
  }

  Serial.print("║ LED: ");
  Serial.print(digitalRead(WIFI_LED_PIN) ? "ON" : "OFF");
  Serial.print(" (WiFi ");
  Serial.print(digitalRead(WIFI_LED_PIN) ? "DISCONNECTED" : "CONNECTED");
  int spacing8 = 17 - (digitalRead(WIFI_LED_PIN) ? 13 : 10);
  for (int i = 0; i < spacing8; i++) Serial.print(" ");
  Serial.println("║");

  Serial.println("╚════════════════════════════════════╝");
  Serial.println("Commands: t-test, s-stop");
  Serial.println("───────────────────────────────────────");
}

// ----------------- Serial Commands -----------------
void handleSerialCommands() {
  if (!Serial.available()) return;

  char c = Serial.read();

  if (c == 't' || c == 'T') {
    testAllDispensers();
  } else if (c == 's' || c == 'S') {
    stopAllDispensers();
  }
}

// ----------------- MAIN LOOP -----------------
void loop() {
  updateWiFiLED();

  handleSerialCommands();

  if (millis() - lastFirestoreCheck >= CHECK_INTERVAL) {
    lastFirestoreCheck = millis();
    checkFirestore();
  }

  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = millis();
    updateAndUploadSensors();
  }

  if (autoModeActive) {
    updateAutoSequence();
  }

  if (millis() - lastDisplay >= DISPLAY_INTERVAL) {
    lastDisplay = millis();
    showStatus();
  }

  delay(50);
}
