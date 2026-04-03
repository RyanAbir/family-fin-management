# Firebase Setup

## Firestore Security Rules

The local app may fail with "Missing or insufficient permissions" until Firestore security rules are published to Firebase.

### Development Rules

The current `firestore.rules` file contains temporary MVP development rules that allow all read/write operations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Publishing Rules

To deploy the rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

### Production Security

⚠️ **Important**: These open rules are temporary for MVP development only. Production rules must be locked down to:

- Require authentication for all operations
- Implement proper data validation
- Restrict access based on user roles and ownership
- Use security rules that match your application's authorization logic

### Configuration Files

- `firebase.json`: Firebase project configuration
- `.firebaserc`: Project ID configuration (update with your actual project ID)
- `firestore.rules`: Security rules for Firestore database access