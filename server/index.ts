import express from "express";

const app = express();
app.use(express.json());

// app.get("/api/...", (req, res) => { ... });

app.listen(3001, () => console.log("Server running on port 3001"));