{
  "rules": {
    "sensor_data": {
      "sensors": {
        ".read": true,
        ".write": false
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    ".read": false,
    ".write": false
  }
}