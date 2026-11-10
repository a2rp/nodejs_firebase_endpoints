# Node.js Firebase Endpoints

A small Express API that demonstrates Firebase Admin SDK setup and basic Cloud Firestore CRUD operations.

## Requirements

- Node.js 22 or newer
- A Firebase project with Cloud Firestore enabled
- Google Application Default Credentials for that project

## Configure credentials

The Firebase Admin SDK uses Application Default Credentials. For local development, create a **new** service-account key in Firebase Console, save it outside the repository, and set `GOOGLE_APPLICATION_CREDENTIALS` to its full path. Never commit a service-account JSON file.

For example, in PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\secure\firebase-service-account.json"
$env:GOOGLE_CLOUD_PROJECT = "your-firebase-project-id"
```

Google Cloud environments can use their attached service identity instead of a downloaded key.

> **Security:** This is an unauthenticated admin CRUD demo. The Admin SDK bypasses Firestore Security Rules. Keep it on localhost with test data; add authentication, authorization, and request protections before exposing it to other users. A service-account key was present in an earlier public revision of this repository. Revoke that old key in Google Cloud IAM and create a replacement; deleting the file from the latest revision does not remove it from Git history.

## Run locally

```bash
npm install
npm run dev
```

The server listens on `127.0.0.1:8080` by default. Set `PORT` or `HOST` to override these values. `npm start` runs the server without the development watcher.

## Endpoints

All request and response bodies use JSON. Requests with bodies are limited to 16 KB.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Check that the API is running |
| `POST` | `/create` | Create a user with `email`, `first_name`, and `last_name` |
| `GET` | `/read/all` | Read up to 100 users |
| `GET` | `/read/:id` | Read a user by Firestore document ID |
| `POST` | `/update` | Update a user using `id` and one or more user fields |
| `DELETE` | `/delete/:id` | Delete a user by Firestore document ID |

Example create request:

```http
POST http://127.0.0.1:8080/create
Content-Type: application/json

{
  "email": "person@example.com",
  "first_name": "Asha",
  "last_name": "Kumar"
}
```

## Configuration

Copy `.env.example` to `.env` and set local values. `.env` and service-account JSON files are ignored by Git. For production, provide configuration through the hosting environment's secret manager.
