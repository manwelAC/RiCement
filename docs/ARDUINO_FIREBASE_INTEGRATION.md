# Arduino Firebase Integration Guide

## Overview
This guide shows how to connect your Arduino to Firebase to read the `timerActive` field from manual projects and control your RiCement machine.

## Hardware Requirements
- ESP8266 or ESP32 board (Arduino Uno/Nano won't work - needs WiFi)
- Relay module (to control your machine)
- Power supply for your machine

## Arduino Libraries Needed
Install these via Arduino IDE Library Manager:
1. **Firebase ESP Client** by Mobizt
2. **ArduinoJson** by Benoit Blanchon

## Firebase Setup

### 1. Get Firebase Credentials
From your Firebase Console:
- **API Key**: `AIzaSyBHfgEDnT4S0DbFeU49g9t8o6hnFEF4cfU`
- **Project ID**: `ricement-app`

**Important:** This code uses **Firestore ONLY** (not Realtime Database). Your app already uses Firestore, so this will work perfectly!

### 2. Firestore REST API Endpoint
The Arduino code uses Firestore REST API v1:
```
https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents:runQuery
```

This is different from Realtime Database (`firebaseio.com`). The code below queries your existing Firestore `manual_projects` collection.

## Arduino Code (ESP8266/ESP32)

```cpp
#include <ESP8266WiFi.h>      // For ESP8266
// #include <WiFi.h>           // For ESP32 (uncomment if using ESP32)
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ========== CONFIGURATION ==========
// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Firebase Configuration
const char* FIREBASE_PROJECT_ID = "ricement-app";
const char* FIREBASE_API_KEY = "AIzaSyBHfgEDnT4S0DbFeU49g9t8o6hnFEF4cfU";

// Hardware Configuration
const int RELAY_PIN = D1;        // GPIO pin connected to relay
const int LED_PIN = D4;          // Built-in LED for status
const int CHECK_INTERVAL = 2000; // Check Firebase every 2 seconds

// ========== GLOBAL VARIABLES ==========
WiFiClientSecure client;
bool machineRunning = false;
unsigned long lastCheck = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("RiCement Arduino Controller");
  Serial.println("=================================\n");
  
  // Setup pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);  // Machine OFF initially
  digitalWrite(LED_PIN, HIGH);   // LED OFF (active low)
  
  // Connect to WiFi
  connectWiFi();
  
  // Configure SSL (Firebase requires HTTPS)
  client.setInsecure(); // For testing - use proper certificate in production
  
  Serial.println("✓ Setup complete! Monitoring Firebase...\n");
}

void loop() {
  // Check if WiFi is still connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected! Reconnecting...");
    connectWiFi();
  }
  
  // Check Firebase at intervals
  if (millis() - lastCheck >= CHECK_INTERVAL) {
    lastCheck = millis();
    checkFirebaseStatus();
  }
  
  delay(100); // Small delay to prevent watchdog resets
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi connection failed!");
  }
}

void checkFirebaseStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  
  // ========== FIRESTORE REST API ENDPOINT ==========
  // This queries YOUR Firestore database (NOT Realtime Database)
  // It searches the "manual_projects" collection
  String url = "https://firestore.googleapis.com/v1/projects/";
  url += FIREBASE_PROJECT_ID;
  url += "/databases/(default)/documents:runQuery";
  
  // ========== FIRESTORE QUERY ==========
  // This is equivalent to:
  // db.collection('manual_projects').where('timerActive', '==', true).limit(1)
  String query = "{"
    "\"structuredQuery\": {"
      "\"from\": [{\"collectionId\": \"manual_projects\"}],"
      "\"where\": {"
        "\"fieldFilter\": {"
          "\"field\": {\"fieldPath\": \"timerActive\"},"
          "\"op\": \"EQUAL\","
          "\"value\": {\"booleanValue\": true}"
        "}"
      "},"
      "\"limit\": 1"
    "}"
  "}";
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(query);
  
  if (httpCode > 0) {
    String payload = http.getString();
    
    // Parse JSON response
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      // Check if we got any results
      if (doc.size() > 0 && doc[0].containsKey("document")) {
        // Active project found - turn ON machine
        JsonObject fields = doc[0]["document"]["fields"];
        
        if (fields.containsKey("timerActive")) {
          bool isActive = fields["timerActive"]["booleanValue"];
          
          if (isActive && !machineRunning) {
            // Start machine
            startMachine();
            
            // Print project details
            if (fields.containsKey("name")) {
              String projectName = fields["name"]["stringValue"];
              Serial.print("📋 Project: ");
              Serial.println(projectName);
            }
            if (fields.containsKey("remainingTime")) {
              int remainingTime = fields["remainingTime"]["integerValue"];
              Serial.print("⏱ Time remaining: ");
              Serial.print(remainingTime);
              Serial.println(" seconds");
            }
          }
        }
      } else {
        // No active projects - turn OFF machine
        if (machineRunning) {
          stopMachine();
        }
      }
    } else {
      Serial.print("✗ JSON parse error: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("✗ HTTP error: ");
    Serial.println(httpCode);
  }
  
  http.end();
}

void startMachine() {
  machineRunning = true;
  digitalWrite(RELAY_PIN, HIGH);  // Turn ON relay
  digitalWrite(LED_PIN, LOW);     // Turn ON LED (active low)
  
  Serial.println("\n🟢 ========== MACHINE STARTED ==========");
  Serial.println("Machine is now RUNNING");
  Serial.println("=======================================\n");
}

void stopMachine() {
  machineRunning = false;
  digitalWrite(RELAY_PIN, LOW);   // Turn OFF relay
  digitalWrite(LED_PIN, HIGH);    // Turn OFF LED
  
  Serial.println("\n🔴 ========== MACHINE STOPPED ==========");
  Serial.println("Machine is now OFF");
  Serial.println("=======================================\n");
}
```

## Wiring Diagram

```
ESP8266/ESP32          Relay Module          Your Machine
===========            ============          ============
D1 (GPIO5)  --------> IN                    
GND         --------> GND                   
5V/3.3V     --------> VCC                   
                      COM    ------------->  Machine Power (+)
                      NO     ------------->  Machine Ground (-)
```

## How It Works

1. **Arduino connects to WiFi** using your credentials
2. **Queries Firestore** every 2 seconds using REST API POST request
3. **Firestore Query Executed:**
   ```javascript
   // Equivalent to this in your mobile app:
   db.collection('manual_projects')
     .where('timerActive', '==', true)
     .limit(1)
     .get()
   ```
4. **If active project found:**
   - Sets `RELAY_PIN` HIGH → Turns ON relay → Machine starts
   - Prints project name and remaining time to Serial Monitor
5. **If no active projects:**
   - Sets `RELAY_PIN` LOW → Turns OFF relay → Machine stops
6. **LED indicates status:**
   - ON = Machine running
   - OFF = Machine stopped

### Firestore Data Flow
```
Mobile App Dashboard
    ↓ (User creates manual project)
Firestore Collection: manual_projects
    {
      name: "Test Project",
      blocks: 5,
      timerActive: true,  ← Arduino reads this!
      remainingTime: 300,
      userId: "abc123",
      ...
    }
    ↓ (Arduino queries every 2 seconds)
Arduino ESP8266/ESP32
    ↓ (If timerActive == true)
Relay Module
    ↓ (Powers the machine)
RiCement Machine RUNNING
    ↓ (Timer reaches 0)
Mobile App sets timerActive: false
    ↓ (Arduino detects change)
Machine STOPS
```

## Installation Steps

### 1. Install Arduino IDE
Download from: https://www.arduino.cc/en/software

### 2. Install ESP8266/ESP32 Board Support
- Open Arduino IDE → File → Preferences
- Add to "Additional Board Manager URLs":
  - ESP8266: `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
  - ESP32: `https://dl.espressif.com/dl/package_esp32_index.json`
- Go to Tools → Board → Boards Manager
- Search and install "esp8266" or "esp32"

### 3. Install Required Libraries
- Sketch → Include Library → Manage Libraries
- Search and install:
  - **ArduinoJson** by Benoit Blanchon (v6.x)

### 4. Configure the Code
Edit these lines in the Arduino code:
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // Your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Your WiFi password
const int RELAY_PIN = D1;                         // Your relay pin
```

### 5. Upload to Arduino
- Tools → Board → Select your ESP8266/ESP32 board
- Tools → Port → Select your COM port
- Click Upload button

### 6. Monitor Serial Output
- Tools → Serial Monitor
- Set baud rate to 115200
- You'll see connection status and machine state

## Testing

### Test 1: WiFi Connection
```
Connecting to WiFi: YourNetwork
..........
✓ WiFi connected!
IP Address: 192.168.1.100
✓ Setup complete! Monitoring Firebase...
```

### Test 2: Create Manual Project (Mobile App)
1. Open RiCement mobile app
2. Go to Dashboard
3. Create manual project with 1 block (1 minute)
4. Arduino Serial Monitor should show:
```
🟢 ========== MACHINE STARTED ==========
📋 Project: Test Project
⏱ Time remaining: 60 seconds
Machine is now RUNNING
=======================================
```

### Test 3: Timer Completes
When timer reaches 0, app sets `timerActive: false`:
```
🔴 ========== MACHINE STOPPED ==========
Machine is now OFF
=======================================
```

## Troubleshooting

### WiFi Not Connecting
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP8266 doesn't support 5GHz)
- Move closer to router

### HTTP Error Codes
- **403 Forbidden**: Check Firebase Security Rules
- **404 Not Found**: Verify project ID and collection name
- **-1 or -2**: SSL certificate issue (normal with `setInsecure()`)

### Machine Not Starting
- Check relay wiring
- Test relay with simple digitalWrite test
- Verify `RELAY_PIN` matches your wiring
- Check relay is powered (VCC and GND)

### Firebase Not Responding
- Verify internet connection
- Check Firebase project ID
- Ensure Firestore collection `manual_projects` exists
- Check Firebase Security Rules allow read access

## Security Considerations

### Current Setup (Testing)
```cpp
client.setInsecure(); // ⚠️ Not secure - skips SSL verification
```

### Production Setup (Recommended)
Add Firebase SSL certificate:
```cpp
const char* FIREBASE_CERT = "-----BEGIN CERTIFICATE-----\n"
"MIIDdTCCAl2gAwIBAgILBAAAAAABFUtaw5QwDQYJKoZIhvcNAQEFBQAwVzELMAkG...\n"
"-----END CERTIFICATE-----\n";

client.setCACert(FIREBASE_CERT);
```

Get certificate from: https://pki.google.com/

## Advanced Features

### Multiple Hardware Units
Each Arduino can monitor different users:
```cpp
// In Firebase query, add userId filter
"\"where\": {"
  "\"compositeFilter\": {"
    "\"op\": \"AND\","
    "\"filters\": ["
      "{\"fieldFilter\": {\"field\": {\"fieldPath\": \"timerActive\"}, \"op\": \"EQUAL\", \"value\": {\"booleanValue\": true}}},"
      "{\"fieldFilter\": {\"field\": {\"fieldPath\": \"userId\"}, \"op\": \"EQUAL\", \"value\": {\"stringValue\": \"user123\"}}}"
    "]"
  "}"
"}"
```

### Status LED Patterns
```cpp
void blinkLED(int times) {
  for(int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(100);
    digitalWrite(LED_PIN, HIGH);
    delay(100);
  }
}

// Use in code:
blinkLED(2); // WiFi connected
blinkLED(3); // Machine started
blinkLED(5); // Error
```

### OLED Display (Optional)
Show status on OLED screen:
```cpp
#include <Wire.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void displayStatus(String status) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("RiCement Control");
  display.println("");
  display.println(status);
  display.display();
}
```

## Summary

**What you need:**
- ✅ ESP8266 or ESP32 (Arduino with WiFi)
- ✅ Relay module
- ✅ WiFi credentials
- ✅ Firebase project ID and API key

**What database it uses:**
- ✅ **Firestore ONLY** (not Realtime Database)
- ✅ Queries the `manual_projects` collection
- ✅ Reads `timerActive` field
- ✅ Compatible with your existing mobile app

**How it works:**
- ✅ Arduino polls Firestore every 2 seconds using REST API
- ✅ Reads `timerActive` from `manual_projects`
- ✅ Controls relay based on status
- ✅ Machine runs while `timerActive === true`

**No tokens needed!** Arduino connects directly to Firestore using REST API.

Your mobile app creates the timer → Firestore stores the state → Arduino reads and controls the machine! 🚀

## Firestore vs Realtime Database

### ✅ This Code Uses: Firestore
```
Endpoint: https://firestore.googleapis.com/v1/projects/ricement-app/databases/(default)/documents:runQuery
Collection: manual_projects
Query: WHERE timerActive == true
```

### ❌ NOT Using: Realtime Database
```
Endpoint: https://ricement-app-default-rtdb.firebaseio.com/
Path: /manual_projects.json
(This code does NOT use this)
```

**Your RiCement app uses Firestore**, so the Arduino code above is already configured correctly!
