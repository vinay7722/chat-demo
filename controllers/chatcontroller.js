const db = require("../config/db");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");

const app = express();

const server = http.createServer(app);
let connectedUsersID = [];
let onlineUsers = [];

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  const userId = socket.handshake.query.userId; // Assuming you pass a user ID during the connection
  console.log("userID", socket.handshake.query.userId);
  connectedUsersID.push(socket.handshake.query.userId);
  // connectedUsersID[userId] = true; // Set the user's status to online

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
    if (!onlineUsers.some((user) => user.userId === data.userId)) {
      // if user is not added before
      onlineUsers.push({ userId: data.userId, socketId: socket.id });
      console.log("new user is here!", onlineUsers);
    }
    io.emit("get-users", onlineUsers);
  });

  socket.on("send_message", (data) => {
    console.log("send_message", data);
    const reversedRoomID = data.roomId.split("-").reverse().join("-");
    socket.to(data.roomId).emit("receive_message", data);
    socket.to(reversedRoomID).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", socket.id);

    const valueToRemove = socket.handshake.query.userId;

    let newArray = connectedUsersID.filter((item) => item !== valueToRemove);
    connectedUsersID = newArray;
    io.emit("get-users", onlineUsers);
    //connectedUsersID[userId] = false;
  });

  socket.on("offline", () => {
    // remove user from active users
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    console.log("user is offline", onlineUsers);
    // send all online users to all users
    io.emit("get-users", onlineUsers);
  });
});

function handleDatabaseError(res, error) {
  return res.status(500).json({
    status: 500,
    message: error.message,
  });
}

exports.getAllusers = (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const Query = `SELECT * FROM user`;

    db.query(Query, (err, results) => {
      if (err) {
        return handleDatabaseError(res, err);
      } else {
        console.log(results);
        let userList = [];
        let currentUserdetails;
        results.forEach((user) => {
          if (phoneNumber === user.phoneNumber) {
            let newObject = {
              id: user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              location: user.location,
              dob: user.dob,
              gender: user.gender,
              profilepicture: user.profilepicture,
              phoneNumber: user.phoneNumber,
            };
            currentUserdetails = newObject;
          } else {
            let newObject = {
              id: user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              location: user.location,
              dob: user.dob,
              gender: user.gender,
              profilepicture: user.profilepicture,
              phoneNumber: user.phoneNumber,
            };
            userList.push(newObject);
          }
        });
        return res.status(200).json({
          status: 200,
          message: "User Data Retrived Successfully",
          data: userList,
          currentUserDetails: currentUserdetails,
        });
      }
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.storeMessage = (req, res) => {
  try {
    const { roomId, message, sender_name, messageType } = req.body;
    const parts = roomId.split("-");
    const senderID = parts[0];
    const receiverID = parts[1];
    const time1 = new Date().toISOString().slice(0, 19).replace("T", " ");
    console.log(time1);
    const Query = `INSERT INTO chats (roomId,sender_id, receiver_id, message, created_at,sender_name,messageType) VALUES (?,?,?,?,?,?,?);`;

    db.query(
      Query,
      [roomId, senderID, receiverID, message, time1, sender_name, messageType],
      (err, results) => {
        if (err) {
          return handleDatabaseError(res, err);
        } else {
          console.log(results);
          return res.status(200).json({
            status: 200,
            message: "Message Inserted Successfully",
          });
        }
      }
    );
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.getChatList = (req, res) => {
  try {
    const { senderID, receiverID } = req.body;

    const Query = `SELECT * FROM chats WHERE sender_id = ${senderID} AND receiver_id = ${receiverID} OR sender_id = ${receiverID} AND receiver_id = ${senderID};`;

    db.query(Query, (err, results) => {
      if (err) {
        return handleDatabaseError(res, err);
      } else {
        console.log(results);
        let messageList = [];
        results.forEach((message) => {
          messageList.push(message);
        });
        return res.status(200).json({
          status: 200,
          message: "User Message Retrived Successfully",
          data: messageList,
        });
      }
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.storeRoomID = (req, res) => {
  try {
    const { roomId } = req.body;
    const parts = roomId.split("-");
    const senderID = parts[0];
    const receiverID = parts[1];
    const time1 = new Date().toISOString().slice(0, 19).replace("T", " ");
    const Query = `INSERT INTO user_conversion (sender_id, receiver_id, room_id ,time) VALUES (?,?,?,?);`;

    db.query(Query, [senderID, receiverID, roomId, time1], (err, results) => {
      if (err) {
        return handleDatabaseError(res, err);
      } else {
        console.log(results);
        return res.status(200).json({
          status: 200,
          message: "RoomID Inserted Successfully",
        });
      }
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.getOnlineAllUser = (req, res) => {
  try {
    const { currentUserID } = req.body;
    const uniqueArray = [...new Set(connectedUsersID)];

    if (uniqueArray.length !== 0) {
      const placeholders = uniqueArray.map(() => "?").join(", ");

      const query = `SELECT * FROM user WHERE id IN (${placeholders})`;

      db.query(query, uniqueArray, (err, results) => {
        if (err) {
          return handleDatabaseError(res, err);
        } else {
          let onlineUserList = [];
          results.forEach((user) => {
            if (currentUserID !== user.id) {
              let newObject = {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                location: user.location,
                dob: user.dob,
                gender: user.gender,
                profilepicture: user.profilepicture,
                phoneNumber: user.phoneNumber,
              };
              onlineUserList.push(newObject);
            }
          });
          if (onlineUserList.length === 0) {
            return res.status(200).json({
              status: 200,
              message: "No Online Users Found",
              data: [],
            });
          } else {
            return res.status(200).json({
              status: 200,
              message: "Online Users Retrived SuccessFully",
              data: onlineUserList,
            });
          }
        }
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: "No Online Users Found",
        data: [],
      });
    }
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.getOnlineUserUsingID = (req, res) => {
  try {
    const uniqueArray = [...new Set(connectedUsersID)];
    const userId = req.body.userId;

    const isOnline = uniqueArray.includes(userId);

    return res.status(200).json({
      status: 200,
      message: "Online Status Retrived successfully",
      isOnline: isOnline,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.server = server;
