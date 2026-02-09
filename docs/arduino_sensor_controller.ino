/*
 * RiCement Arduino Pump Controller with 4 Ultrasonic Sensors
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DualServoController.h"
#include "UltrasonicSensor.h"
#include "FirebaseManager.h"

// ----------------- WiFi Configuration -----------------
#define WIFI_SSID "Converge_2MFA"
#define WIFI_PASS "954736WA"

// ----------------- Firebase Configuration -----------------
#define FIREBASE_PROJECT_ID "ricement-app"

// ----------------- Pump (BTS7960) Pins -----------------
#define RPWM 25
#define REN 26
#define LEN 33

// ----------------- Servo Pins -----------------
#define SERVO_PIN_1 13
#define SERVO_PIN_2 14

// ----------------- Ultrasonic Sensor Pins -----------------
#define US1_TRIG 5
#define US1_ECHO 18
#define US2_TRIG 19
#define US2_ECHO 21
#define US3_TRIG 22
#define US3_ECHO 23
#define US4_TRIG 2
#define US4_ECHO 4

// ----------------- Component Objects -----------------
DualServoController servos(SERVO_PIN_1, SERVO_PIN_2);
FirebaseManager firebase(FIREBASE_PROJECT_ID);

// Ultrasonic Sensors
UltrasonicSensor sensor1(US1_TRIG, US1_ECHO, "sensor_1");
UltrasonicSensor sensor2(US2_TRIG, US2_ECHO, "sensor_2");
UltrasonicSensor sensor3(US3_TRIG, US3_ECHO, "sensor_3");
UltrasonicSensor sensor4(US4_TRIG, US4_ECHO, "sensor_4");
UltrasonicSensor* sensors[4] = {&sensor1, &sensor2, &sensor3, &sensor4};

// ----------------- Variables -----------------
bool pumpActive = false;
unsigned long lastCheck = 0;
const unsigned long checkInterval = 3000;

// ----------------- Setup -----------------
void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🚀 RiCement System with 4 Ultrasonic Sensors");
  Serial.println("================================================");

  // Initialize pump pins
  pinMode(RPWM, OUTPUT);
  pinMode(REN, OUTPUT);
  pinMode(LEN, OUTPUT);
  digitalWrite(REN, LOW);
  digitalWrite(LEN, LOW);
  analogWrite(RPWM, 0);

  // Initialize servos
  servos.begin();

  // Initialize ultrasonic sensors
  for (int i = 0; i < 4; i++) {
    sensors[i]->begin();
  }

  // Initialize Firebase
  firebase.begin();

  connectWiFi();
  
  Serial.println("✅ All components initialized!");
  Serial.println("================================================\n");
}

// ----------------- WiFi -----------------
void connectWiFi() {
  Serial.print("📡 Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 20000) {
    Serial.print(".");
    delay(500);
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected");
    Serial.print("📡 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Failed - Retrying...");
    delay(5000);
    ESP.restart();
  }
}

// ----------------- Pump Control -----------------
void controlPump(bool active) {
  if (active && !pumpActive) {
    digitalWrite(REN, HIGH);
    digitalWrite(LEN, HIGH);
    analogWrite(RPWM, 255);
    pumpActive = true;
    Serial.println("💧💧💧 PUMP ON 💧💧💧");
  } else if (!active && pumpActive) {
    analogWrite(RPWM, 0);
    digitalWrite(REN, LOW);
    digitalWrite(LEN, LOW);
    pumpActive = false;
    Serial.println("💧 PUMP OFF");
  }
}

// ----------------- Read All Sensors -----------------
String readAllSensors() {
  String json = "{";
  json += "\"timestamp\": " + String(millis()) + ",";
  json += "\"sensors\": {";
  
  for (int i = 0; i < 4; i++) {
    if (sensors[i]->shouldRead()) {
      json += sensors[i]->getDataJSON();
      if (i < 3) json += ",";
      
      // Print to serial for monitoring
      int percent = sensors[i]->readDistancePercent();
      Serial.print("📊 " + sensors[i]->getName() + ": ");
      Serial.print(percent);
      Serial.println("%");
    }
  }
  
  json += "}}";
  return json;
}

// ----------------- Firestore Query -----------------
bool checkAnyTimerActive() {
  HTTPClient http;
  
  Serial.println("🔍 Querying Firestore for active timers...");
  
  String url = "https://firestore.googleapis.com/v1/projects/";
  url += FIREBASE_PROJECT_ID;
  url += "/databases/(default)/documents:runQuery";
  
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
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(query);
  
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(4096);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      if (doc.size() > 0 && doc[0].containsKey("document")) {
        JsonObject document = doc[0]["document"];
        JsonObject fields = document["fields"];
        
        Serial.print("✅ ACTIVE PROJECT FOUND: ");
        
        if (fields.containsKey("name")) {
          Serial.print(fields["name"]["stringValue"].as<String>());
        }
        
        if (fields.containsKey("remainingTime")) {
          int remainingTime = fields["remainingTime"]["integerValue"];
          Serial.print(" (");
          Serial.print(remainingTime);
          Serial.print("s remaining)");
        }
        
        if (fields.containsKey("blocks")) {
          int blocks = fields["blocks"]["integerValue"];
          Serial.print(" [");
          Serial.print(blocks);
          Serial.print(" blocks]");
        }
        
        Serial.println();
        http.end();
        return true;
      } else {
        Serial.println("ℹ️ No active timers found");
      }
    } else {
      Serial.print("⚠️ JSON parse error: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("⚠️ HTTP Error: ");
    Serial.println(httpCode);
  }
  
  http.end();
  return false;
}

// ----------------- Main Loop -----------------
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("📡 WiFi lost - reconnecting...");
    controlPump(false);
    connectWiFi();
  }

  // Read ultrasonic sensors
  String sensorData = readAllSensors();

  // Update Firebase with sensor data every 2 seconds
  if (firebase.shouldUpdate()) {
    if (firebase.updateSensorData(sensorData)) {
      Serial.println("✅ Sensor data sent to Firebase");
    }
  }

  // Check Firestore every 3 seconds
  if (millis() - lastCheck >= checkInterval) {
    lastCheck = millis();
    
    bool anyTimerActive = checkAnyTimerActive();
    
    Serial.print("🎯 RESULT: ");
    if (anyTimerActive) {
      Serial.println("ACTIVE TIMER → PUMP ON");
    } else {
      Serial.println("NO ACTIVE TIMERS → PUMP OFF");
    }
    
    controlPump(anyTimerActive);
    
    // Update servos - they will activate after 10 seconds if pump stays active
    servos.update(anyTimerActive);
    
    Serial.println("================================================\n");
  }
  
  delay(50); // Small delay for stability
}