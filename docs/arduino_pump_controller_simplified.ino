/*
 * RiCement Arduino Pump Controller - SIMPLIFIED VERSION
 * 
 * This code monitors Firestore for active manual_projects (timerActive == true)
 * and controls a pump via BTS7960 motor driver.
 * 
 * NO AUTHENTICATION NEEDED - Your Firestore rules allow public read access
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ----------------- WiFi Configuration -----------------
#define WIFI_SSID "TECNO CAMON 30 5G"
#define WIFI_PASS "1234567890"

// ----------------- Firebase Configuration -----------------
#define FIREBASE_PROJECT_ID "ricement-app"

// ----------------- Pump (BTS7960) Pins -----------------
#define RPWM 25
#define REN 26
#define LEN 33

// ----------------- Variables -----------------
bool pumpActive = false;
unsigned long lastCheck = 0;
const unsigned long checkInterval = 3000; // Check every 3 seconds

// ----------------- Setup -----------------
void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🚀 FIRESTORE PUMP CONTROLLER (NO AUTH)");
  Serial.println("==========================================");

  // Initialize pump pins
  pinMode(RPWM, OUTPUT);
  pinMode(REN, OUTPUT);
  pinMode(LEN, OUTPUT);
  digitalWrite(REN, LOW);
  digitalWrite(LEN, LOW);
  analogWrite(RPWM, 0);

  connectWiFi();
  
  Serial.println("✅ Ready to monitor Firestore!");
  Serial.println("==========================================\n");
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

// ----------------- Query Firestore for Active Timers -----------------
bool checkAnyTimerActive() {
  HTTPClient http;
  
  Serial.println("🔍 Querying Firestore for active timers...");
  
  // Firestore REST API runQuery endpoint
  String url = "https://firestore.googleapis.com/v1/projects/";
  url += FIREBASE_PROJECT_ID;
  url += "/databases/(default)/documents:runQuery";
  
  // Build query: SELECT * FROM manual_projects WHERE timerActive = true LIMIT 1
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
    
    // Parse JSON response
    DynamicJsonDocument doc(4096);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      // Check if we got any results
      if (doc.size() > 0 && doc[0].containsKey("document")) {
        // Found an active project!
        JsonObject document = doc[0]["document"];
        JsonObject fields = document["fields"];
        
        Serial.print("✅ ACTIVE PROJECT FOUND: ");
        
        // Print project details
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
    if (httpCode > 0) {
      Serial.println("Response: " + http.getString());
    }
  }
  
  http.end();
  return false;
}

// ----------------- Main Loop -----------------
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("📡 WiFi lost - reconnecting...");
    controlPump(false); // Turn off pump if WiFi lost
    connectWiFi();
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
    Serial.println("==========================================\n");
  }
  
  delay(100);
}
