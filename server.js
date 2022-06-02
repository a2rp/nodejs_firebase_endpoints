const express = require('express');
const app = express();

const admin = require('firebase-admin');
const credentials = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const db = admin.firestore();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.post("/create", async (req, res)=>{
    try {
        console.log(req.body);
        const id = req.body.email;
        const user_json = {
            email: req.body.email,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
        };
        const response = await db.collection("users").add(user_json);
        res.send(response);
    }
    catch (error) {
        res.send(error);
    }
});

app.get("/read/all", async (req,res)=>{
    try {
        const user_ref = db.collection("users");
        const response = await user_ref.get();
        let response_arr = [];
        response.forEach(doc=>{
            response_arr.push(doc.data());
        });
        res.send(response_arr);
    }
    catch (error) {
        res.send(error);
    }
});

app.get("/read/:id", async (req,res)=>{
    try {
        const user_ref = db.collection("users").doc(req.params.id);
        const response = await user_ref.get();
        res.send(response.data());
    }
    catch (error) {
        res.send(error);
    }
});

app.post("/update", async (req,res)=>{
    try {
        const id = req.body.id;
        const new_first_name = "new first name";
        const user_ref = await db.collection("users").doc(id).update({
            first_name: new_first_name
        });
        res.send(user_ref);
    }
    catch (error) {
        res.send(error);
    }
});

app.delete("/delete/:id", async (req,res)=>{
    try {
        const response = await db.collection("users").doc(req.params.id).delete();
        res.send(response);
    }
    catch (error) {
        res.send(error);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=>{
    console.log(`server is running at ${PORT}`);
});


