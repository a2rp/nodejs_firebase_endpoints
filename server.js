require("dotenv").config();

const express = require("express");
const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "127.0.0.1";

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
}

initializeApp({ credential: applicationDefault() });

const db = getFirestore();
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

function invalidInput(message) {
    const error = new Error(message);
    error.code = "INVALID_INPUT";
    return error;
}

function getDocumentId(value) {
    if (typeof value !== "string" || value.trim().length === 0 || value.includes("/")) {
        throw invalidInput("A valid document ID is required.");
    }

    return value.trim();
}

function getUserFields(body, { partial = false } = {}) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw invalidInput("A JSON object is required.");
    }

    const fields = {};
    const allowedFields = ["email", "first_name", "last_name"];

    for (const field of allowedFields) {
        const value = body[field];

        if (value === undefined && partial) {
            continue;
        }

        if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 150) {
            throw invalidInput(`${field} must be a non-empty string of at most 150 characters.`);
        }

        fields[field] = value.trim();
    }

    if (fields.email && !/^\S+@\S+\.\S+$/.test(fields.email)) {
        throw invalidInput("email must be a valid email address.");
    }

    if (partial && Object.keys(fields).length === 0) {
        throw invalidInput("At least one user field must be supplied.");
    }

    return fields;
}

app.get("/", (req, res) => {
    res.json({ success: true, message: "Firebase Firestore API is running." });
});

app.post("/create", asyncHandler(async (req, res) => {
    const user = getUserFields(req.body);
    const document = await db.collection("users").add(user);

    res.status(201).json({ success: true, user: { id: document.id, ...user } });
}));

app.get("/read/all", asyncHandler(async (req, res) => {
    const snapshot = await db.collection("users").limit(100).get();
    const users = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));

    res.json({ success: true, users, limit: 100 });
}));

app.get("/read/:id", asyncHandler(async (req, res) => {
    const id = getDocumentId(req.params.id);
    const document = await db.collection("users").doc(id).get();

    if (!document.exists) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, user: { id: document.id, ...document.data() } });
}));

app.post("/update", asyncHandler(async (req, res) => {
    const id = getDocumentId(req.body?.id);
    const fields = getUserFields(req.body, { partial: true });
    const documentRef = db.collection("users").doc(id);
    const existingDocument = await documentRef.get();

    if (!existingDocument.exists) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    await documentRef.update(fields);
    const document = await documentRef.get();

    res.json({ success: true, user: { id: document.id, ...document.data() } });
}));

app.delete("/delete/:id", asyncHandler(async (req, res) => {
    const id = getDocumentId(req.params.id);
    await db.collection("users").doc(id).delete();

    res.status(204).end();
}));

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const isMalformedJson = error.type === "entity.parse.failed";
    const isOversizedBody = error.type === "entity.too.large";
    const isInvalidInput = error.code === "INVALID_INPUT";
    const status = isMalformedJson ? 400 : isOversizedBody ? 413 : isInvalidInput ? 400 : 500;
    const message = isMalformedJson
        ? "Invalid JSON request body."
        : isOversizedBody
            ? "Request body too large."
            : isInvalidInput
                ? error.message
                : "Internal server error.";

    if (status === 500) {
        console.error("Request failed:", error.name || "Error");
    }

    res.status(status).json({ success: false, message });
});

app.listen(PORT, HOST, () => {
    console.log(`Firebase Firestore API running at http://${HOST}:${PORT}`);
});
