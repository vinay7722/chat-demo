const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatcontroller");
const { authenticateToken } = require("../middlewares/jwtMiddleware");

router.post("/getChatList", chatController.getChatList); //done
router.post("/storeMessage", chatController.storeMessage); //done
router.post("/storeRoomID", chatController.storeRoomID);
router.post("/getAllusers", chatController.getAllusers); //done
router.post("/getOnlineAllUser", chatController.getOnlineAllUser);
router.post("/getOnlineUserstatus", chatController.getOnlineUserUsingID);

module.exports = router;
