const Nexmo = require("nexmo");
const db = require("../config/db");
const { generateAccessToken } = require("../middlewares/jwtMiddleware");
const multer = require("multer");
const path = require("path");

// Replace with env Nexmo API key and secret
const nexmo = new Nexmo({
  apiKey: "3afe74d1",
  apiSecret: "Ag0ojPJqSEr8EUp3",
});

async function executeQuery(query, params) {
  try {
    db.query(query, params, (err, results) => {
      if (err) {
        return err.message;
      } else {
        console.log("17", results);
        return results;
      }
    });
    // Handle cases where results is undefined or null
  } catch (error) {
    throw error;
  }
}

function handleDatabaseError(res, error) {
  return res.status(500).json({
    status: 500,
    message: error.message,
  });
}

async function sendSMS(from, to, otp) {
  const text = `Your OTP Was a ${otp}`;
  console.log(from, to, text);
  // return new Promise((resolve, reject) => {
  //   nexmo.message.sendSms(from, to, text, (err, responseData) => {
  //     if (err) {
  //       reject(err);
  //     } else {
  //       resolve();
  //     }
  //   });
  // });
}

async function sendSMSToNewUser(from, to, phoneNumber, otp) {
  try {
    const insertQuery =
      "INSERT INTO user (phonenumber, isVerified , otp) VALUES (?, ? , ?)";
    await executeQuery(insertQuery, [phoneNumber, 0, otp]);
    await sendSMS(from, to, otp);
  } catch (error) {
    throw error;
  }
}

exports.sendSMStoMobileNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const from = "+918866502081";

    const selectQuery = "SELECT * FROM user WHERE phonenumber = ?";
    db.query(selectQuery, [phoneNumber], async (err, results) => {
      if (err) {
        return handleDatabaseError(res, err);
      } else {
        if (results.length === 0) {
          const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
          sendSMSToNewUser(from, phoneNumber, phoneNumber, otp);
          return res.status(200).json({
            status: 200,
            message: "OTP sent Successfully",
            isVerified: false,
          });
        } else {
          if (results[0].isVerified === 0) {
            //is not verified send code again
            await sendSMS(from, phoneNumber, results[0].otp);
            return res.status(200).json({
              status: 200,
              isVerified: false,
              message: "User is Not Verified",
            });
          } else {
            return res.status(200).json({
              status: 200,
              isVerified: true,
              message: "User Already Registered",
              token: generateAccessToken({
                user_id: phoneNumber,
              }),
            });
          }
        }
      }
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const from = "+918866502081";
    const to = phoneNumber;
    let otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    const query = "SELECT * FROM user WHERE phonenumber = ?";
    db.query(query, [phoneNumber], async (err, results) => {
      if (err) {
        return handleDatabaseError(res, err);
      } else {
        //when phonenumber not registered
        if (results.length === 0) {
          return res.status(500).json({
            status: 500,
            message: "User is Not register yet Please First Register User",
          });
        } else {
          await sendSMS(from, phoneNumber, results[0].otp);
          return res.status(200).json({
            status: 200,
            message: "OTP sent Successfully",
          });
        }
      }
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, enteredOTP } = req.body;

    const userQuery = "SELECT * FROM user WHERE phonenumber = ?";
    // Check if the user exists and is not already verified
    db.query(userQuery, [phoneNumber], (err, userResults) => {
      if (err) {
        return handleDatabaseError(res, err);
      }

      if (userResults.length === 0) {
        return res.status(500).json({
          status: 500,
          message: "User Is Not Registered",
        });
      }

      if (userResults[0].isVerified === 1) {
        return res.status(200).json({
          status: 200,
          message: "User Is Already Verified",
          token: generateAccessToken({
            user_id: phoneNumber,
          }),
        });
      }

      if (userResults[0].otp === parseInt(enteredOTP)) {
        // Update the user's verification status
        const updateVerificationStatusQuery =
          "UPDATE user SET isVerified = ? WHERE phonenumber = ?";
        db.query(
          updateVerificationStatusQuery,
          [1, phoneNumber],
          (updateErr) => {
            if (updateErr) {
              return handleDatabaseError(res, updateErr);
            }

            return res.status(200).json({
              status: 200,
              message: "OTP Verified Successfully",
              token: generateAccessToken({
                user_id: phoneNumber,
              }),
            });
          }
        );
      } else {
        return res.status(500).json({
          status: 500,
          message: "Please Enter Correct OTP",
        });
      }
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

exports.saveProfileDetails = (req, res) => {
  try {
    const { name, username, email, location, dob, gender, phoneNumber } =
      req.body;

    const updateQuery = `UPDATE user
      SET 
          name = ?,
          username = ?,
          email = ?,
          location = ?,
          dob = ?,
          gender = ?
      WHERE phonenumber = ?`;

    db.query(
      updateQuery,
      [name, username, email, location, dob, gender, phoneNumber],
      (err, results) => {
        if (err) {
          return handleDatabaseError(res, err);
        } else if (results.affectedRows === 0) {
          return res.status(500).json({
            status: 500,
            message: "No Users Found Using This Mobile Number",
          });
        } else {
          return res.status(200).json({
            status: 200,
            message: "User Data Updated Successfully",
          });
        }
      }
    );
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

// Multer
let storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const dir = path.join(__dirname, "..", "public", "images");
    console.log(dir);
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    const date = new Date();
    const timestamp = date.getTime();
    const fileExtension = path.extname(file.originalname);
    const newFilename = `${timestamp}${fileExtension}`;
    //here add name into db
    callback(null, newFilename);
  },
});

const upload = multer({ storage: storage }).single("file");

const UpdateImageNameIntoDB = async (fileName, phoneNumber) => {
  let NewFileName = `images/${fileName}`;
  let query = "UPDATE user SET profilepicture = ? WHERE phonenumber = ?";
  await executeQuery(query, [NewFileName, phoneNumber]);
  return NewFileName;
};

exports.createImg = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.log(err);
      return handleDatabaseError(res, err);
      // res.send(err);
    } else {
      console.log(req.file);
      let newFileName = await UpdateImageNameIntoDB(
        req.file.filename,
        req.body.phone
      );
      return res.status(200).json({
        status: 200,
        message: "Image Upload SuccessFully",
        ImagePath: newFileName,
      });
      //res.send(req.file);
    }
  });
};
