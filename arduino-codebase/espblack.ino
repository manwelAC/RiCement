/*
  * RiCement Arduino Pump Controller - FINAL WORKING VERSION with Emergency Stop Fix
  * Lahat gumagana: UP (RPWM 16), DOWN (LPWM 4), at timerActive (pump)
  * ADDED: timerActive → Pump 60s → Down 8s
  * FIXED: Emergency stop button debouncing and state management
  * Test time: 3 seconds
  */

  #include <Arduino.h>
  #include <WiFi.h>
  #include <HTTPClient.h>
  #include <ESP32Servo.h>
  #include <ESP32PWM.h>
  #include <Wire.h>
  #include <Adafruit_VL53L0X.h>
  #include "WormMotor.h"
  #include "MixerUp.h"

  // ----------------- WiFi Configuration -----------------
  #define WIFI_SSID "ricementhp"
  #define WIFI_PASS "123456789"

  // ----------------- WiFi LED -----------------
  #define WIFI_LED_PIN 25

  // ----------------- Firestore -----------------
  #define FIREBASE_PROJECT_ID "ricement-app"
  #define FIRESTORE_URL "https://firestore.googleapis.com/v1/projects/" FIREBASE_PROJECT_ID "/databases/(default)/documents:runQuery"
  #define MANUAL_CONTROLLER_DOC_ID "S9RJ8cWlvQSGroOSTvF5ecol9Ab2"
  #define MANUAL_CONTROLLER_URL "https://firestore.googleapis.com/v1/projects/" FIREBASE_PROJECT_ID "/databases/(default)/documents/manual_controller/" MANUAL_CONTROLLER_DOC_ID
  #define SERVO_FIRESTORE_FIELD "dispense_sand"
  #define RTDB_URL "https://ricement-app-default-rtdb.asia-southeast1.firebasedatabase.app"
  #define SENSOR3_PATH "/sensor_data/sensors/sensor_3.json"
  #define SERVO_TEST_PATH "/sensor_data/dispense_sand.json"

  // ----------------- Pin Definitions -----------------
  // Pump (mixing) - timerActive
  #define PUMP_RPWM 18
  #define PUMP_REN 17
  #define PUMP_LEN 5

  // Worm motor - up (RPWM) and down (LPWM)
  #define WORM_LPWM 4   // DOWN motor - LPWM
  #define WORM_RPWM 16  // UP motor - RPWM
  #define WORM_REN 2
  #define WORM_LEN 15

  // Sand dispensing servo (360 servo)
  #define SAND_SERVO_PIN 26

  // Emergency stop push button (2-pin: GPIO <-> GND)
  #define EMERGENCY_STOP_PIN 27
  // Pressed state is LOW (based on observed wiring behavior)
  #define EMERGENCY_ACTIVE_LEVEL LOW
  #define EMERGENCY_LED_PIN 26  // Using same pin as sand servo? Change if needed

  // VL53L0X (I2C)
  #define LASER_SCL_PIN 33
  #define LASER_SDA_PIN 32

  const int SERVO_FORWARD_VAL = 180;
  const int SERVO_STOP_VAL = 90;
  const int SERVO_REVERSE_VAL = 0;

  const int SERVO_FORWARD_US = 2000;
  const int SERVO_STOP_US = 1500;
  const int SERVO_REVERSE_US = 1000;

  const unsigned long SERVO_OPEN_TIME = 2000;   // 2 seconds FORWARD
  const unsigned long SERVO_STAY_TIME = 8000;   // 8 seconds STOP
  const unsigned long SERVO_CLOSE_TIME = 2000;  // 2 seconds BACKWARD
  const unsigned long SERVO_MANUAL_TIME = 2000; // 2 seconds for ON/OFF manual test

  // ----------------- Objects -----------------
  WormMotor wormMotor(WORM_LPWM, WORM_REN, WORM_LEN);  // DOWN motor (LPWM)
  MixerUp mixerUp(WORM_RPWM, WORM_REN, WORM_LEN);      // UP motor (RPWM)
  Servo sandServo;
  Adafruit_VL53L0X lox = Adafruit_VL53L0X();

  // ----------------- Variables -----------------
  bool pumpActive = false;
  bool upRunning = false;
  bool downRunning = false;

  unsigned long pumpStartTime = 0;
  unsigned long upStartTime = 0;
  unsigned long downStartTime = 0;

  const unsigned long PUMP_RUN_TIME = 60000;  // 60 seconds for pump
  const unsigned long AUTO_MOTOR_RUN_TIME = 5400;    // 5.4s for Firestore/timerActive triggered up/down
  const unsigned long MANUAL_MOTOR_RUN_TIME = 8000;  // 8s for serial manual up/down
  const unsigned long TEST_RUN_TIME = 3000;    // 3 seconds for manual test

  unsigned long upRunDuration = MANUAL_MOTOR_RUN_TIME;
  unsigned long downRunDuration = MANUAL_MOTOR_RUN_TIME;

  unsigned long lastFirestoreCheck = 0;
  const unsigned long CHECK_INTERVAL = 1000;

  unsigned long lastDisplay = 0;
  const unsigned long DISPLAY_INTERVAL = 2000;

  // Track last values
  bool lastUpValue = false;
  bool lastDownValue = false;
  bool lastTimerActive = false;
  bool timerActivePending = false;

  // Firestore manual_controller booleans (direct ON/OFF)
  bool manualMixerUp = false;    // mixer_up -> WORM_RPWM (pin 16)
  bool manualMixerDown = false;  // mixer_down -> WORM_LPWM (pin 4)
  bool manualMix = false;        // mix -> PUMP_RPWM (pin 18)
  bool manualSandCommand = false; // dispense_sand -> true:forward 2s, false:reverse 2s
  bool sandLastCommand = false;

  bool lastManualMixerUp = false;
  bool lastManualMixerDown = false;
  bool lastManualMix = false;
  bool lastManualSandCommand = false;

  // 🆁🅴🅳 - Para sa timerActive sequence
  bool pumpSequenceActive = false;  // Para malaman kung galing sa timerActive ang pump
  bool pumpToDownDone = false;      // Para hindi umulit ang down

  enum DispenseState {
    DISPENSE_IDLE,
    DISPENSE_OPENING,
    DISPENSE_STAYING,
    DISPENSE_CLOSING
  };

  DispenseState dispenseState = DISPENSE_IDLE;
  unsigned long dispenseStateStart = 0;

  bool manualServoRun = false;
  bool manualServoForward = false;
  unsigned long manualServoStart = 0;
  bool sandServoAttached = false;
  bool sandCommandQueued = false;
  bool queuedSandCommand = false;

  enum ManualSandState {
    SAND_IDLE,
    SAND_FORWARD,
    SAND_REVERSE
  };

  ManualSandState manualSandState = SAND_IDLE;
  unsigned long manualSandStartTime = 0;

  unsigned long lastLaserRead = 0;
  const unsigned long LASER_READ_INTERVAL = 1000;
  int laserDistanceMm = -1;
  bool laserReady = false;
  unsigned long lastLaserInitAttempt = 0;
  const unsigned long LASER_RETRY_INTERVAL = 5000;
  unsigned long lastSensorUpload = 0;
  const unsigned long SENSOR_UPLOAD_INTERVAL = 2000;
  unsigned long lastSandRtdbPoll = 0;
  const unsigned long SAND_RTDB_POLL_INTERVAL = 500;
  unsigned long lastRtdbSandSuccess = 0;
  bool rtdbSandHealthy = false;

  const int SENSOR_MIN_MM = 30;
  const int SENSOR_MAX_MM = 600;
  const unsigned long FIRESTORE_HTTP_TIMEOUT = 1200;
  const unsigned long EMERGENCY_DEBOUNCE_MS = 50;  // Increased for better stability

  bool emergencyStopActive = false;
  bool emergencyButtonRaw = false;
  unsigned long emergencyButtonLastChange = 0;
  uint8_t firestorePollPhase = 0;

  // Debug counter for button testing
  unsigned long lastButtonDebugPrint = 0;

  // ----------------- Function Declarations -----------------
  void connectWiFi();
  void checkFirestore();
  void checkManualControllerStatus();
  void checkPumpStatus();
  void checkUpStatus();
  void checkDownStatus();
  void updateMotors();
  void showStatus();
  void testAllMotors();
  void stopAllMotors();
  void startDispenseSequence();
  void triggerManualSandMove(bool command, unsigned long nowMs);
  void ensureSandServoAttached();
  void servoForward();
  void servoStop();
  void servoReverse();
  void servoStopAndDetach();
  bool extractFirestoreBool(const String& payload, const char* fieldName);
  void initLaserSensor();
  void updateLaserSensor();
  int mapDistanceToPercent(int distanceMm);
  void uploadSensor3Data();
  bool readLatestManualSandCommand();
  void ensureServoTestVariable();
  bool readServoTestCommandFromRTDB(bool* ok);
  void pollManualSandFromRTDB();
  bool readManualControllerFromQuery(bool& mixerUp, bool& mixerDown, bool& mix, bool& dispenseSand);
  void updateEmergencyStop();
  bool emergencyAwareDelay(unsigned long durationMs);

  // ----------------- SETUP -----------------
  void setup() {
    Serial.begin(115200);
    delay(2000);
    
    Serial.println("\n==========================================");
    Serial.println("RiCement Controller - FINAL VERSION with Emergency Stop Fix");
    Serial.println("==========================================");
    Serial.println("📌 timerActive -> manual_projects (PUMP)");
    Serial.println("    → Pump 60s → Down 5.4s");
    Serial.println("📌 up -> projects collection (UP MOTOR - RPWM 16, 5.4s)");
    Serial.println("📌 down -> projects collection (DOWN MOTOR - LPWM 4, 5.4s)");
    Serial.println("📌 timerActive servo -> FWD 2s → OFF 8s → BWD 2s");
    Serial.println("📌 VL53L0X -> SDA 32, SCL 33");
    Serial.println("📌 Emergency STOP button -> GPIO 27 to GND");
    Serial.println("==========================================");
    Serial.println("Commands:");
    Serial.println("  t - Test all motors (3 seconds each)");
    Serial.println("  u - Test UP motor only (RPWM 16) - 8 sec");
    Serial.println("  d - Test DOWN motor only (LPWM 4) - 8 sec");
    Serial.println("  p - Test PUMP only - 60 sec");
    Serial.println("  c - Test SAND dispense sequence (FWD 2s, STAY 8s, BWD 2s)");
    Serial.println("  on - Servo forward 2 seconds");
    Serial.println("  off - Servo OFF");
    Serial.println("  s - Stop all motors");
    Serial.println("==========================================\n");
    
    pinMode(WIFI_LED_PIN, OUTPUT);
    digitalWrite(WIFI_LED_PIN, HIGH);

    // Emergency stop button initialization with proper debouncing
    pinMode(EMERGENCY_STOP_PIN, INPUT_PULLUP);
    
    // Emergency stop LED (optional - change pin if needed)
    // pinMode(EMERGENCY_LED_PIN, OUTPUT);
    // digitalWrite(EMERGENCY_LED_PIN, LOW);
    
    // Initialize emergency stop state properly
    emergencyButtonRaw = (digitalRead(EMERGENCY_STOP_PIN) == EMERGENCY_ACTIVE_LEVEL);
    emergencyStopActive = emergencyButtonRaw; // Set initial state
    emergencyButtonLastChange = millis();
    
    if (emergencyStopActive) {
      Serial.println("⚠️ Emergency stop button is PRESSED at startup!");
      Serial.println("   Release button to begin normal operation");
    }
    
    pinMode(PUMP_RPWM, OUTPUT);
    pinMode(PUMP_REN, OUTPUT);
    pinMode(PUMP_LEN, OUTPUT);
    digitalWrite(PUMP_REN, LOW);
    digitalWrite(PUMP_LEN, LOW);
    analogWrite(PUMP_RPWM, 0);
    
    pinMode(WORM_LPWM, OUTPUT);
    pinMode(WORM_RPWM, OUTPUT);
    pinMode(WORM_REN, OUTPUT);
    pinMode(WORM_LEN, OUTPUT);
    
    digitalWrite(WORM_REN, LOW);
    digitalWrite(WORM_LEN, LOW);
    analogWrite(WORM_RPWM, 0);
    analogWrite(WORM_LPWM, 0);
    
    wormMotor.begin();
    mixerUp.begin();

    ESP32PWM::allocateTimer(0);
    ESP32PWM::allocateTimer(1);
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);
    Serial.println("ℹ️ Sand dispensing logic disabled for faster response");

    initLaserSensor();
    
    connectWiFi();
    
    Serial.println("\n✅ System Ready!\n");
    Serial.println("💡 Emergency stop button: Press to stop all motors, press again to resume\n");
  }

  // ----------------- WiFi Connection -----------------
  void connectWiFi() {
    Serial.print("Connecting to WiFi");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
      Serial.print(".");
      delay(500);
      attempts++;
      digitalWrite(WIFI_LED_PIN, !digitalRead(WIFI_LED_PIN));
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ WiFi Connected!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      digitalWrite(WIFI_LED_PIN, LOW);
    } else {
      Serial.println("\n❌ WiFi Failed!");
    }
  }

  void initLaserSensor() {
    lastLaserInitAttempt = millis();
    Wire.begin(LASER_SDA_PIN, LASER_SCL_PIN);
    Wire.setClock(100000);
    delay(50);

    Serial.println("VL53L0X Test");
    if (!lox.begin()) {
      laserReady = false;
      Serial.println("⚠️ Failed to boot VL53L0X");
      return;
    }

    laserReady = true;
    Serial.println("✅ Sensor ready!");
  }

  void updateLaserSensor() {
    unsigned long now = millis();

    if (!laserReady) {
      if (now - lastLaserInitAttempt >= LASER_RETRY_INTERVAL) {
        initLaserSensor();
      }
      return;
    }

    if (now - lastLaserRead < LASER_READ_INTERVAL) return;
    lastLaserRead = now;

    VL53L0X_RangingMeasurementData_t measure;
    lox.rangingTest(&measure, false);

    if (measure.RangeStatus != 4) {
      laserDistanceMm = measure.RangeMilliMeter;
    } else {
      laserDistanceMm = -1;
    }
  }

  int mapDistanceToPercent(int distanceMm) {
    if (distanceMm <= SENSOR_MIN_MM) return 0;
    if (distanceMm >= SENSOR_MAX_MM) return 100;

    float ratio = (float)(distanceMm - SENSOR_MIN_MM) / (float)(SENSOR_MAX_MM - SENSOR_MIN_MM);
    int percent = (int)(ratio * 100.0f + 0.5f);
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    return percent;
  }

  void uploadSensor3Data() {
    if (WiFi.status() != WL_CONNECTED || !laserReady) return;
    if (manualServoRun || (manualSandState != SAND_IDLE) || dispenseState != DISPENSE_IDLE) return;

    unsigned long now = millis();
    if (now - lastSensorUpload < SENSOR_UPLOAD_INTERVAL) return;
    lastSensorUpload = now;

    int distanceMm = (laserDistanceMm >= 0) ? laserDistanceMm : SENSOR_MIN_MM;
    int distancePercent = mapDistanceToPercent(distanceMm);
    int distanceCm = distanceMm / 10;

    String payload = "{";
    payload += "\"distance_cm\":" + String(distanceCm) + ",";
    payload += "\"distance_percent\":" + String(distancePercent) + ",";
    payload += "\"max_distance\":" + String(SENSOR_MAX_MM) + ",";
    payload += "\"timestamp\":" + String(now);
    payload += "}";

    HTTPClient http;
    String url = String(RTDB_URL) + String(SENSOR3_PATH);
    http.begin(url);
    http.setTimeout(7000);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.PATCH(payload);
    String response = http.getString();

    if (httpCode < 200 || httpCode >= 300) {
      http.end();

      // Fallback to PUT in case PATCH is blocked by gateway/rules behavior
      HTTPClient httpPut;
      httpPut.begin(url);
      httpPut.setTimeout(7000);
      httpPut.addHeader("Content-Type", "application/json");
      httpCode = httpPut.PUT(payload);
      response = httpPut.getString();
      httpPut.end();
    } else {
      http.end();
    }

    if (httpCode > 0 && httpCode < 300) {
      static unsigned long lastUploadLog = 0;
      if (now - lastUploadLog >= 10000) {
        lastUploadLog = now;
        Serial.print("📡 sensor_3 uploaded: ");
        Serial.print(distanceMm);
        Serial.print("mm (");
        Serial.print(distancePercent);
        Serial.println("%)");
      }
    } else {
      Serial.print("⚠️ sensor_3 upload failed, HTTP ");
      Serial.println(httpCode);
      if (response.length() > 0) {
        Serial.println(response);
      }
    }
  }

  // ----------------- Stop All Motors -----------------
  void stopAllMotors() {
    analogWrite(WORM_RPWM, 0);
    analogWrite(WORM_LPWM, 0);
    analogWrite(PUMP_RPWM, 0);
    digitalWrite(WORM_REN, LOW);
    digitalWrite(WORM_LEN, LOW);
    digitalWrite(PUMP_REN, LOW);
    digitalWrite(PUMP_LEN, LOW);
    upRunning = false;
    downRunning = false;
    pumpActive = false;
    pumpSequenceActive = false;  // 🆁🅴🅳
    pumpToDownDone = false;      // 🆁🅴🅳
    dispenseState = DISPENSE_IDLE;
    dispenseStateStart = 0;
    timerActivePending = false;
    manualServoRun = false;
    manualServoForward = false;
    manualServoStart = 0;
    manualSandState = SAND_IDLE;
    manualSandStartTime = 0;
    sandCommandQueued = false;
    queuedSandCommand = false;
    servoStopAndDetach();
    Serial.println("🔧 All motors stopped");
  }

  void updateEmergencyStop() {
    unsigned long now = millis();
    bool rawPressed = (digitalRead(EMERGENCY_STOP_PIN) == EMERGENCY_ACTIVE_LEVEL);
    
    // Check if button state has changed
    if (rawPressed != emergencyButtonRaw) {
      emergencyButtonRaw = rawPressed;
      emergencyButtonLastChange = now;
      
      // Debug print for button state changes (limit frequency)
      if (now - lastButtonDebugPrint > 1000) {
        Serial.print("🔘 Emergency button state changed to: ");
        Serial.println(rawPressed ? "PRESSED" : "RELEASED");
        lastButtonDebugPrint = now;
      }
    }
    
    // Only update after debounce time has passed
    if (now - emergencyButtonLastChange >= EMERGENCY_DEBOUNCE_MS) {
      if (emergencyButtonRaw != emergencyStopActive) {
        emergencyStopActive = emergencyButtonRaw;
        
        // Update LED indicator if used
        // digitalWrite(EMERGENCY_LED_PIN, emergencyStopActive ? HIGH : LOW);
        
        if (emergencyStopActive) {
          stopAllMotors();
          Serial.println("\n🛑🛑🛑 EMERGENCY STOP ACTIVE - all outputs forced OFF 🛑🛑🛑");
          Serial.println("   Press button again to release emergency stop\n");
        } else {
          Serial.println("\n✅✅✅ EMERGENCY STOP RELEASED - normal operation resumed ✅✅✅");
          Serial.println("   System ready for commands\n");
          // Reset any pending states that might need clearing
          timerActivePending = false;
          pumpSequenceActive = false;
          pumpToDownDone = false;
        }
      }
    }
  }

  bool emergencyAwareDelay(unsigned long durationMs) {
    unsigned long start = millis();
    while (millis() - start < durationMs) {
      updateEmergencyStop();
      if (emergencyStopActive) {
        return true;
      }
      delay(5);
    }
    return false;
  }

  void ensureSandServoAttached() {
    if (sandServoAttached) return;
    sandServo.attach(SAND_SERVO_PIN);
    delay(20);
    sandServoAttached = true;
  }

  void servoForward() {
    ensureSandServoAttached();
    sandServo.write(SERVO_FORWARD_VAL);
  }

  void servoStop() {
    ensureSandServoAttached();
    sandServo.write(SERVO_STOP_VAL);
  }

  void servoReverse() {
    ensureSandServoAttached();
    sandServo.write(SERVO_REVERSE_VAL);
  }

  void servoStopAndDetach() {
    if (!sandServoAttached) return;
    sandServo.write(SERVO_STOP_VAL);
    delay(200);
    sandServo.detach();
    sandServoAttached = false;
  }

  void startDispenseSequence() {
    return;
  }

  void triggerManualSandMove(bool command, unsigned long nowMs) {
    (void)nowMs;
    sandLastCommand = command;
    manualSandState = SAND_IDLE;
  }

  // ----------------- Test All Motors -----------------
  void testAllMotors() {
    if (emergencyStopActive) {
      Serial.println("❌ Cannot test: Emergency stop is ACTIVE!");
      return;
    }
    
    Serial.println("\n🔧 TESTING ALL MOTORS (3 seconds each)");
    
    Serial.println("1. Testing UP motor (RPWM 16) - 3 seconds...");
    digitalWrite(WORM_REN, HIGH);
    digitalWrite(WORM_LEN, HIGH);
    if (emergencyAwareDelay(10)) return;
    analogWrite(WORM_RPWM, 255);
    if (emergencyAwareDelay(3000)) return;
    analogWrite(WORM_RPWM, 0);
    if (emergencyAwareDelay(500)) return;
    
    Serial.println("2. Testing DOWN motor (LPWM 4) - 3 seconds...");
    analogWrite(WORM_LPWM, 255);
    if (emergencyAwareDelay(3000)) return;
    analogWrite(WORM_LPWM, 0);
    if (emergencyAwareDelay(500)) return;
    
    Serial.println("3. Testing PUMP - 3 seconds...");
    digitalWrite(PUMP_REN, HIGH);
    digitalWrite(PUMP_LEN, HIGH);
    analogWrite(PUMP_RPWM, 255);
    if (emergencyAwareDelay(3000)) return;
    analogWrite(PUMP_RPWM, 0);
    digitalWrite(PUMP_REN, LOW);
    digitalWrite(PUMP_LEN, LOW);
    
    digitalWrite(WORM_REN, LOW);
    digitalWrite(WORM_LEN, LOW);
    
    Serial.println("✅ Test complete");
  }

  // ----------------- Check PUMP Status -----------------
  void checkPumpStatus() {
    if (WiFi.status() != WL_CONNECTED) return;
    
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
    query += "\"limit\": 5";
    query += "}";
    query += "}";
    
    http.begin(FIRESTORE_URL);
    http.setTimeout(FIRESTORE_HTTP_TIMEOUT);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(query);
    
    if (httpCode == 200) {
      String payload = http.getString();
      
      bool timerActiveNow = (payload.indexOf("\"document\"") >= 0);

      if (timerActiveNow && !lastTimerActive && !emergencyStopActive) {
        timerActivePending = true;
        Serial.println("🟢 timerActive detected");
      }
      
      // 🆁🅴🅓 - Start pump/servo when timerActive edge exists and system is free
      if (timerActivePending && !pumpActive && !upRunning && !downRunning && !manualMix && !manualMixerUp && !manualMixerDown && !emergencyStopActive) {
        pumpStartTime = millis();
        pumpActive = true;
        pumpSequenceActive = true;     // 🆁🅴🅓 - Mark na galing sa timerActive ito
        pumpToDownDone = false;        // 🆁🅴🅓 - Reset down flag
        timerActivePending = false;

        startDispenseSequence();
        
        digitalWrite(PUMP_REN, HIGH);
        digitalWrite(PUMP_LEN, HIGH);
        analogWrite(PUMP_RPWM, 255);
        
        Serial.println("\n💧💧💧 PUMP STARTED (60 seconds)");
        Serial.println("→ Down motor will start after pump");
      }
      
      lastTimerActive = timerActiveNow;
    }
    
    http.end();
  }

  bool extractFirestoreBool(const String& payload, const char* fieldName) {
    String fieldToken = "\"" + String(fieldName) + "\"";
    int fieldPos = payload.indexOf(fieldToken);
    if (fieldPos < 0) return false;

    int boolPos = payload.indexOf("\"booleanValue\":", fieldPos);
    if (boolPos < 0) return false;

    int truePos = payload.indexOf("true", boolPos);
    int falsePos = payload.indexOf("false", boolPos);

    if (truePos >= 0 && (falsePos < 0 || truePos < falsePos)) return true;
    return false;
  }

  void checkManualControllerStatus() {
    if (WiFi.status() != WL_CONNECTED) return;

    HTTPClient http;

    http.begin(MANUAL_CONTROLLER_URL);
    http.setTimeout(FIRESTORE_HTTP_TIMEOUT);
    int httpCode = http.GET();

    if (httpCode == 200) {
      String payload = http.getString();

      manualMixerUp = extractFirestoreBool(payload, "mixer_up");
      manualMixerDown = extractFirestoreBool(payload, "mixer_down");
      manualMix = extractFirestoreBool(payload, "mix");
      manualSandCommand = false;
      rtdbSandHealthy = false;
    } else {
      Serial.print("⚠️ manual_controller GET HTTP ");
      Serial.println(httpCode);

      bool qMixerUp = false;
      bool qMixerDown = false;
      bool qMix = false;
      bool qDispenseSand = false;
      if (readManualControllerFromQuery(qMixerUp, qMixerDown, qMix, qDispenseSand)) {
        manualMixerUp = qMixerUp;
        manualMixerDown = qMixerDown;
        manualMix = qMix;
        manualSandCommand = false;
        Serial.println("✅ manual_controller fallback query success");
      }
    }

    http.end();

    if (manualMixerUp != lastManualMixerUp || manualMixerDown != lastManualMixerDown || manualMix != lastManualMix || manualSandCommand != lastManualSandCommand) {
      Serial.print("🕹️ Manual controller -> mixer_up:");
      Serial.print(manualMixerUp ? "ON" : "OFF");
      Serial.print(" mixer_down:");
      Serial.print(manualMixerDown ? "ON" : "OFF");
      Serial.print(" mix:");
      Serial.print(manualMix ? "ON" : "OFF");
      Serial.print(" servo_cmd(");
      Serial.print(SERVO_FIRESTORE_FIELD);
      Serial.print("):");
      Serial.println(manualSandCommand ? "TRUE" : "FALSE");

      lastManualMixerUp = manualMixerUp;
      lastManualMixerDown = manualMixerDown;
      lastManualMix = manualMix;
      lastManualSandCommand = manualSandCommand;
    }
  }

  bool readLatestManualSandCommand() {
    HTTPClient http;

    String query = "{";
    query += "\"structuredQuery\": {";
    query += "\"from\": [{\"collectionId\": \"manual_controller\"}],";
    query += "\"orderBy\": [{";
    query += "\"field\": {\"fieldPath\": \"updatedAt\"},";
    query += "\"direction\": \"DESCENDING\"";
    query += "}],";
    query += "\"limit\": 1";
    query += "}";
    query += "}";

    http.begin(FIRESTORE_URL);
    http.setTimeout(FIRESTORE_HTTP_TIMEOUT);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(query);
    bool result = false;

    if (httpCode == 200) {
      String payload = http.getString();
      result = extractFirestoreBool(payload, SERVO_FIRESTORE_FIELD);
    } else {
      Serial.print("⚠️ readLatestManualSandCommand HTTP ");
      Serial.println(httpCode);
    }

    http.end();
    return result;
  }

  bool readManualControllerFromQuery(bool& mixerUp, bool& mixerDown, bool& mix, bool& dispenseSand) {
    mixerUp = false;
    mixerDown = false;
    mix = false;
    dispenseSand = false;

    HTTPClient http;

    String query = "{";
    query += "\"structuredQuery\": {";
    query += "\"from\": [{\"collectionId\": \"manual_controller\"}],";
    query += "\"orderBy\": [{";
    query += "\"field\": {\"fieldPath\": \"updatedAt\"},";
    query += "\"direction\": \"DESCENDING\"";
    query += "}],";
    query += "\"limit\": 1";
    query += "}";
    query += "}";

    http.begin(FIRESTORE_URL);
    http.setTimeout(FIRESTORE_HTTP_TIMEOUT);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(query);
    bool ok = false;

    if (httpCode == 200) {
      String payload = http.getString();
      mixerUp = extractFirestoreBool(payload, "mixer_up");
      mixerDown = extractFirestoreBool(payload, "mixer_down");
      mix = extractFirestoreBool(payload, "mix");
      dispenseSand = extractFirestoreBool(payload, SERVO_FIRESTORE_FIELD);
      ok = true;
    } else {
      Serial.print("⚠️ manual_controller fallback query HTTP ");
      Serial.println(httpCode);
    }

    http.end();
    return ok;
  }

  void ensureServoTestVariable() {
    if (WiFi.status() != WL_CONNECTED) return;

    String url = String(RTDB_URL) + String(SERVO_TEST_PATH);

    HTTPClient http;
    http.begin(url);
    http.setTimeout(7000);
    int getCode = http.GET();
    String existing = http.getString();
    http.end();

    existing.trim();
    if (getCode == 200 && (existing == "true" || existing == "false")) {
      Serial.println("✅ RTDB servo test variable ready");
      return;
    }

    HTTPClient httpPut;
    httpPut.begin(url);
    httpPut.setTimeout(7000);
    httpPut.addHeader("Content-Type", "application/json");
    int putCode = httpPut.PUT("false");
    httpPut.end();

    if (putCode > 0 && putCode < 300) {
      Serial.println("✅ RTDB initialized: /sensor_data/dispense_sand = false");
    } else {
      Serial.print("⚠️ RTDB init failed for servo test variable, HTTP ");
      Serial.println(putCode);
    }
  }

  bool readServoTestCommandFromRTDB(bool* ok) {
    if (ok) *ok = false;
    if (WiFi.status() != WL_CONNECTED) return false;

    String url = String(RTDB_URL) + String(SERVO_TEST_PATH);
    HTTPClient http;
    http.begin(url);
    http.setTimeout(7000);

    int httpCode = http.GET();
    bool command = false;

    if (httpCode == 200) {
      String payload = http.getString();
      payload.trim();

      if (payload == "true" || payload == "\"true\"") {
        command = true;
        if (ok) *ok = true;
      } else if (payload == "false" || payload == "\"false\"") {
        command = false;
        if (ok) *ok = true;
      } else {
        static unsigned long lastInvalidPayloadLog = 0;
        unsigned long now = millis();
        if (now - lastInvalidPayloadLog >= 5000) {
          lastInvalidPayloadLog = now;
          Serial.print("⚠️ RTDB /dispense_sand invalid payload: ");
          Serial.println(payload);
        }
      }
    } else {
      static unsigned long lastHttpFailLog = 0;
      unsigned long now = millis();
      if (now - lastHttpFailLog >= 5000) {
        lastHttpFailLog = now;
        Serial.print("⚠️ RTDB /dispense_sand GET HTTP ");
        Serial.println(httpCode);
      }
    }

    http.end();
    return command;
  }

  void pollManualSandFromRTDB() {
    if (WiFi.status() != WL_CONNECTED) {
      rtdbSandHealthy = false;
      return;
    }

    unsigned long now = millis();
    if (now - lastSandRtdbPoll < SAND_RTDB_POLL_INTERVAL) return;
    lastSandRtdbPoll = now;

    bool ok = false;
    bool command = readServoTestCommandFromRTDB(&ok);

    if (ok) {
      manualSandCommand = command;
      rtdbSandHealthy = true;
      lastRtdbSandSuccess = now;
    } else {
      if (!rtdbSandHealthy) {
        manualSandCommand = false;
      }
      if (now - lastRtdbSandSuccess > 10000) {
        rtdbSandHealthy = false;
        manualSandCommand = false;
      }
    }
  }

  // ----------------- Check UP Status -----------------
  void checkUpStatus() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    HTTPClient http;
    
    String query = "{";
    query += "\"structuredQuery\": {";
    query += "\"from\": [{\"collectionId\": \"projects\"}],";
    query += "\"where\": {";
    query += "\"fieldFilter\": {";
    query += "\"field\": {\"fieldPath\": \"up\"},";
    query += "\"op\": \"EQUAL\",";
    query += "\"value\": {\"booleanValue\": true}";
    query += "}";
    query += "},";
    query += "\"limit\": 5";
    query += "}";
    query += "}";
    
    http.begin(FIRESTORE_URL);
    http.setTimeout(FIRESTORE_HTTP_TIMEOUT);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(query);
    
    if (httpCode == 200) {
      String payload = http.getString();
      
      bool upNow = (payload.indexOf("\"booleanValue\": true") > 0);
      
      if (upNow && !lastUpValue && !upRunning && !downRunning && !pumpActive && !manualMix && !manualMixerUp && !manualMixerDown && !emergencyStopActive) {
        upStartTime = millis();
        upRunning = true;
        upRunDuration = AUTO_MOTOR_RUN_TIME;
        
        digitalWrite(WORM_REN, HIGH);
        digitalWrite(WORM_LEN, HIGH);
        delay(10);
        analogWrite(WORM_RPWM, 255);
        
        Serial.println("\n🔼🔼🔼 UP MOTOR STARTED (RPWM 16) - 5.4 seconds");
      }
      
      lastUpValue = upNow;
    }
    
    http.end();
  }

  // ----------------- Check DOWN Status -----------------
  void checkDownStatus() {
    if (WiFi.status() != WL_CONNECTED) return;
    
    HTTPClient http;
    
    String query = "{";
    query += "\"structuredQuery\": {";
    query += "\"from\": [{\"collectionId\": \"projects\"}],";
    query += "\"where\": {";
    query += "\"fieldFilter\": {";
    query += "\"field\": {\"fieldPath\": \"down\"},";
    query += "\"op\": \"EQUAL\",";
    query += "\"value\": {\"booleanValue\": true}";
    query += "}";
    query += "},";
    query += "\"limit\": 5";
    query += "}";
    query += "}";
    
    http.begin(FIRESTORE_URL);
    http.setTimeout(FIRESTORE_HTTP_TIMEOUT);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(query);
    
    if (httpCode == 200) {
      String payload = http.getString();
      
      bool downNow = (payload.indexOf("\"booleanValue\": true") > 0);
      
      if (downNow && !lastDownValue && !downRunning && !upRunning && !pumpActive && !manualMix && !manualMixerUp && !manualMixerDown && !emergencyStopActive) {
        downStartTime = millis();
        downRunning = true;
        downRunDuration = AUTO_MOTOR_RUN_TIME;
        
        digitalWrite(WORM_REN, HIGH);
        digitalWrite(WORM_LEN, HIGH);
        delay(10);
        analogWrite(WORM_LPWM, 255);
        
        Serial.println("\n🔽🔽🔽 DOWN MOTOR STARTED (LPWM 4) - 5.4 seconds");
      }
      
      lastDownValue = downNow;
    }
    
    http.end();
  }

  // ----------------- Check All Firestore -----------------
  void checkFirestore() {
    if (WiFi.status() != WL_CONNECTED) return;

    checkManualControllerStatus();

    if (firestorePollPhase == 0) {
      checkPumpStatus();
    } else if (firestorePollPhase == 1) {
      checkUpStatus();
    } else {
      checkDownStatus();
    }

    firestorePollPhase = (firestorePollPhase + 1) % 3;
  }

  // ----------------- Update Motors -----------------
  void updateMotors() {
    unsigned long now = millis();
    (void)now;
    
    // Update PUMP
    if (pumpActive) {
      if (now - pumpStartTime >= PUMP_RUN_TIME) {
        analogWrite(PUMP_RPWM, 0);
        digitalWrite(PUMP_REN, LOW);
        digitalWrite(PUMP_LEN, LOW);
        pumpActive = false;
        Serial.println("\n✅ Pump finished (60 seconds)");
        
        // 🆁🅴🅓 - Start down motor if this pump came from timerActive
        if (pumpSequenceActive && !pumpToDownDone && !emergencyStopActive) {
          downStartTime = millis();
          downRunning = true;
          downRunDuration = AUTO_MOTOR_RUN_TIME;
          pumpToDownDone = true;  // Para hindi na umulit
          
          digitalWrite(WORM_REN, HIGH);
          digitalWrite(WORM_LEN, HIGH);
          delay(10);
          analogWrite(WORM_LPWM, 255);
          
          Serial.println("\n⬇️⬇️⬇️ DOWN MOTOR STARTED (5.4 seconds) - from pump sequence");
        }
        
        pumpSequenceActive = false;  // Reset
        
      } else {
        if ((now - pumpStartTime) % 10000 < 50) {
          int remaining = (PUMP_RUN_TIME - (now - pumpStartTime)) / 1000;
          Serial.print("⏳ Pump: ");
          Serial.print(remaining);
          Serial.println("s remaining");
        }
      }
    }
    
    // Update UP motor
    if (upRunning) {
      if (now - upStartTime >= upRunDuration) {
        analogWrite(WORM_RPWM, 0);
        upRunning = false;
        Serial.println("\n⏹️ UP MOTOR STOPPED");
        
        if (!downRunning) {
          digitalWrite(WORM_REN, LOW);
          digitalWrite(WORM_LEN, LOW);
        }
      } else {
        if ((now - upStartTime) % 2000 < 50) {
          int remaining = (upRunDuration - (now - upStartTime)) / 1000;
          Serial.print("⏳ UP: ");
          Serial.print(remaining);
          Serial.println("s remaining");
        }
      }
    }
    
    // Update DOWN motor
    if (downRunning) {
      if (now - downStartTime >= downRunDuration) {
        analogWrite(WORM_LPWM, 0);
        downRunning = false;
        Serial.println("\n⏹️ DOWN MOTOR STOPPED");
        
        if (!upRunning) {
          digitalWrite(WORM_REN, LOW);
          digitalWrite(WORM_LEN, LOW);
        }
      } else {
        if ((now - downStartTime) % 2000 < 50) {
          int remaining = (downRunDuration - (now - downStartTime)) / 1000;
          Serial.print("⏳ DOWN: ");
          Serial.print(remaining);
          Serial.println("s remaining");
        }
      }
    }
    
    // Final output layer: merge timed logic + Firestore manual_controller booleans
    // But respect emergency stop - force all outputs off if emergency active
    if (emergencyStopActive) {
      analogWrite(PUMP_RPWM, 0);
      digitalWrite(PUMP_REN, LOW);
      digitalWrite(PUMP_LEN, LOW);
      analogWrite(WORM_RPWM, 0);
      analogWrite(WORM_LPWM, 0);
      digitalWrite(WORM_REN, LOW);
      digitalWrite(WORM_LEN, LOW);
      return;
    }
    
    bool pumpCommand = pumpActive || manualMix;
    bool wormUpCommand = upRunning || manualMixerUp;
    bool wormDownCommand = downRunning || manualMixerDown;

    if (pumpCommand) {
      digitalWrite(PUMP_REN, HIGH);
      digitalWrite(PUMP_LEN, HIGH);
      analogWrite(PUMP_RPWM, 255);
    } else {
      analogWrite(PUMP_RPWM, 0);
      digitalWrite(PUMP_REN, LOW);
      digitalWrite(PUMP_LEN, LOW);
    }

    static bool wormConflictLogged = false;
    if (wormUpCommand && wormDownCommand) {
      analogWrite(WORM_RPWM, 0);
      analogWrite(WORM_LPWM, 0);
      digitalWrite(WORM_REN, LOW);
      digitalWrite(WORM_LEN, LOW);

      if (!wormConflictLogged) {
        Serial.println("⚠️ mixer_up and mixer_down are both TRUE -> outputs forced OFF for safety");
        wormConflictLogged = true;
      }
    } else {
      wormConflictLogged = false;

      if (wormUpCommand || wormDownCommand) {
        digitalWrite(WORM_REN, HIGH);
        digitalWrite(WORM_LEN, HIGH);
      } else {
        digitalWrite(WORM_REN, LOW);
        digitalWrite(WORM_LEN, LOW);
      }

      analogWrite(WORM_RPWM, wormUpCommand ? 255 : 0);
      analogWrite(WORM_LPWM, wormDownCommand ? 255 : 0);
    }
  }

  // ----------------- Status Display -----------------
  void showStatus() {
    Serial.println("\n╔════════════════════════════════════╗");
    Serial.println("║         SYSTEM STATUS              ║");
    Serial.println("╠════════════════════════════════════╣");
    
    Serial.print("║ Pump: ");
    if (pumpActive) {
      unsigned long elapsed = millis() - pumpStartTime;
      int remaining = (PUMP_RUN_TIME - elapsed) / 1000;
      Serial.print("ON (");
      Serial.print(remaining);
      Serial.println("s)              ║");
    } else if (manualMix) {
      Serial.println("MANUAL ON                    ║");
    } else {
      Serial.println("OFF                          ║");
    }
    
    Serial.print("║ UP: ");
    if (upRunning) {
      unsigned long elapsed = millis() - upStartTime;
      int remaining = (upRunDuration - elapsed) / 1000;
      Serial.print("ON (");
      Serial.print(remaining);
      Serial.println("s)                ║");
    } else if (manualMixerUp) {
      Serial.println("MANUAL ON                    ║");
    } else {
      Serial.println("OFF                          ║");
    }
    
    Serial.print("║ DOWN: ");
    if (downRunning) {
      unsigned long elapsed = millis() - downStartTime;
      int remaining = (downRunDuration - elapsed) / 1000;
      Serial.print("ON (");
      Serial.print(remaining);
      Serial.println("s)              ║");
    } else if (manualMixerDown) {
      Serial.println("MANUAL ON                    ║");
    } else {
      Serial.println("OFF                          ║");
    }
    
    Serial.print("║ WiFi: ");
    Serial.println(WiFi.status() == WL_CONNECTED ? "Connected                    ║" : "Disconnected                 ║");

    Serial.print("║ E-STOP: ");
    if (emergencyStopActive) {
      Serial.println("⚠️ ACTIVE - PRESSED!          ║");
    } else {
      Serial.println("✅ READY - NOT PRESSED        ║");
    }

    Serial.print("║ Dispense: ");
    if (manualSandState == SAND_FORWARD) {
      Serial.println("MANUAL SAND FORWARD          ║");
    } else if (manualSandState == SAND_REVERSE) {
      Serial.println("MANUAL SAND REVERSE          ║");
    } else if (manualServoRun) {
      Serial.println(manualServoForward ? "MANUAL ON                    ║" : "MANUAL OFF                   ║");
    } else if (dispenseState == DISPENSE_OPENING) {
      Serial.println("AUTO ON                      ║");
    } else if (dispenseState == DISPENSE_STAYING) {
      Serial.println("AUTO STAY                    ║");
    } else if (dispenseState == DISPENSE_CLOSING) {
      Serial.println("AUTO CLOSE                   ║");
    } else {
      Serial.println("OFF                          ║");
    }

    Serial.print("║ Laser: ");
    if (!laserReady) {
      Serial.println("Not ready                    ║");
    } else if (laserDistanceMm >= 0) {
      Serial.print(laserDistanceMm);
      Serial.println(" mm                     ║");
    } else {
      Serial.println("Out of range                 ║");
    }
    
    Serial.println("╚════════════════════════════════════╝");
  }

  // ----------------- Manual Commands -----------------
  void handleSerialCommands() {
    if (!Serial.available()) return;

    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toLowerCase();

    if (cmd.length() == 0) return;

    if (emergencyStopActive) {
      Serial.println("🛑 Emergency active. Release button to accept commands.");
      return;
    }

    if (cmd == "t") {
        testAllMotors();
    }
    else if (cmd == "u") {
        if (!upRunning && !downRunning && !pumpActive && !emergencyStopActive) {
          upStartTime = millis();
          upRunning = true;
          upRunDuration = MANUAL_MOTOR_RUN_TIME;
          digitalWrite(WORM_REN, HIGH);
          digitalWrite(WORM_LEN, HIGH);
          delay(10);
          analogWrite(WORM_RPWM, 255);
          Serial.println("🔧 Manual UP started - 8 seconds");
        }
    }
    else if (cmd == "d") {
        if (!upRunning && !downRunning && !pumpActive && !emergencyStopActive) {
          downStartTime = millis();
          downRunning = true;
          downRunDuration = MANUAL_MOTOR_RUN_TIME;
          digitalWrite(WORM_REN, HIGH);
          digitalWrite(WORM_LEN, HIGH);
          delay(10);
          analogWrite(WORM_LPWM, 255);
          Serial.println("🔧 Manual DOWN started - 8 seconds");
        }
    }
    else if (cmd == "p") {
        if (!upRunning && !downRunning && !pumpActive && !emergencyStopActive) {
          pumpStartTime = millis();
          pumpActive = true;
          pumpSequenceActive = false;  // Manual pump, walang kasunod na down
          digitalWrite(PUMP_REN, HIGH);
          digitalWrite(PUMP_LEN, HIGH);
          analogWrite(PUMP_RPWM, 255);
          Serial.println("🔧 Manual PUMP started - 60 seconds");
        }
    }
    else if (cmd == "c") {
        Serial.println("ℹ️ Sand dispense disabled");
    }
    else if (cmd == "on") {
        Serial.println("ℹ️ Sand dispense disabled");
    }
    else if (cmd == "off") {
        Serial.println("ℹ️ Sand dispense disabled");
    }
    else if (cmd == "s") {
        stopAllMotors();
    }
    else {
      Serial.println("Invalid command. Use: t/u/d/p/c/on/off/s");
    }
  }

  // ----------------- MAIN LOOP -----------------
  void loop() {
    updateEmergencyStop();

    // If emergency stop is active, still need to update WiFi LED and handle serial
    // but motors are already stopped by updateEmergencyStop and updateMotors will keep them off
    digitalWrite(WIFI_LED_PIN, WiFi.status() != WL_CONNECTED);
    
    // Handle serial commands (will be blocked if emergency active)
    handleSerialCommands();

    // Keep motors/servo responsive first (high priority)
    updateMotors();
    updateLaserSensor();

    bool servoBusy = false;
    
    if (!servoBusy) {
      unsigned long now = millis();
      if (now - lastFirestoreCheck >= CHECK_INTERVAL) {
        while (now - lastFirestoreCheck >= CHECK_INTERVAL) {
          lastFirestoreCheck += CHECK_INTERVAL;
        }

        if (WiFi.status() == WL_CONNECTED) {
          checkFirestore();
        }
      }
    }
    
    if (millis() - lastDisplay >= DISPLAY_INTERVAL) {
      lastDisplay = millis();
      showStatus();
    }
    
    uploadSensor3Data();
    
    delay(10);
  }