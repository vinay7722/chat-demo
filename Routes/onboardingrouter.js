const express = require("express");
const router = express.Router();
const onboardingController = require("../controllers/onboardingcontrollers");
const { authenticateToken } = require("../middlewares/jwtMiddleware");

router.post(
  "/sendSMStoMobileNumber",
  onboardingController.sendSMStoMobileNumber
);
router.post("/verifyOTP", onboardingController.verifyOTP);
router.post("/resendOTP", onboardingController.resendOTP); 
router.post(
  "/saveProfileDetails",
  authenticateToken,
  onboardingController.saveProfileDetails
);
router.post('/storeimg',onboardingController.createImg)



module.exports = router;
  