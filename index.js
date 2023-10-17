const express = require("express");
const cors = require("cors");
const http = require("http");

const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { server } = require("./controllers/chatcontroller");

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const onboardingRouter = require("./Routes/onboardingrouter");
const chatrouter = require("./Routes/chatrouter");

app.use(bodyParser.json());

app.use("/onboarding", onboardingRouter);
app.use("/chat", chatrouter);

//to serve images folder
app.use("/images", express.static("public/images"));

server.listen(3002, () => {
  console.log("Socket server is running on 3002");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
