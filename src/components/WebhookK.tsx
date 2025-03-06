// const express = require("express");
// const app = express();
//
// const VERIFY_TOKEN = "token_akamedia_080325";
//
// app.get("/akahook", (req, res) => {
//     let mode = req.query["hub.mode"];
//     let token = req.query["hub.verify_token"];
//     let challenge = req.query["hub.challenge"];
//
//     if (mode === "subscribe" && token === VERIFY_TOKEN) {
//         console.log("Webhook verified!");
//         res.status(200).send(challenge); // Trả về challenge để xác thực
//     } else {
//         console.log("Verification failed!");
//         res.sendStatus(403);
//     }
// });
//
// app.listen(3000, () => console.log("Server is running on port 3000"));
