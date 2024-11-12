"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRides = exports.updatingRideStatus = exports.newRide = exports.getDriversById = exports.updateDriverStatus = exports.getLoggedInDriverData = exports.verifyingEmailOtp = exports.sendingOtpToEmail = exports.verifyPhoneOtpForRegistration = exports.verifyPhoneOtpForLogin = exports.sendingOtpToPhone = void 0;
require('dotenv').config();
const twilio_1 = __importDefault(require("twilio"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const send_token_1 = require("../utils/send-token");
const app_1 = require("../app");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (0, twilio_1.default)(accountSid, authToken, {
    lazyLoading: true,
});
// sending otp to driver phone number
const sendingOtpToPhone = async (req, res, next) => {
    try {
        const { phone_number } = req.body;
        // console.log('phone_number', phone_number);
        try {
            await client.verify.v2
                ?.services(process.env.TWILIO_SERVICE_SID)
                .verifications.create({
                channel: 'sms',
                to: phone_number,
            });
            res.status(201).json({
                success: true,
            });
        }
        catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
        });
    }
};
exports.sendingOtpToPhone = sendingOtpToPhone;
// verifying otp for login
const verifyPhoneOtpForLogin = async (req, res, next) => {
    try {
        const { phone_number, otp } = req.body;
        try {
            await client.verify.v2
                .services(process.env.TWILIO_SERVICE_SID)
                .verificationChecks.create({
                to: phone_number,
                code: otp,
            });
            const driver = await prisma_1.default.driver.findUnique({
                where: {
                    phone_number,
                },
            });
            (0, send_token_1.sendToken)(driver, res);
        }
        catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                message: 'Something went wrong!',
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
        });
    }
};
exports.verifyPhoneOtpForLogin = verifyPhoneOtpForLogin;
// verifying phone otp for registration
const verifyPhoneOtpForRegistration = async (req, res, next) => {
    try {
        const { phone_number, otp } = req.body;
        try {
            await client.verify.v2
                .services(process.env.TWILIO_SERVICE_SID)
                .verificationChecks.create({
                to: phone_number,
                code: otp,
            });
            await (0, exports.sendingOtpToEmail)(req, res);
        }
        catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                message: 'Something went wrong!',
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
        });
    }
};
exports.verifyPhoneOtpForRegistration = verifyPhoneOtpForRegistration;
// sending otp to email
const sendingOtpToEmail = async (req, res) => {
    try {
        const { name, country, phone_number, email, vehicle_type, registration_number, registration_date, driving_license, vehicle_color, rate, } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const driver = {
            name,
            country,
            phone_number,
            email,
            vehicle_type,
            registration_number,
            registration_date,
            driving_license,
            vehicle_color,
            rate,
        };
        const token = jsonwebtoken_1.default.sign({
            driver,
            otp,
        }, process.env.EMAIL_ACTIVATION_SECRET, {
            expiresIn: '5m',
        });
        try {
            await app_1.nylas.messages.send({
                identifier: process.env.USER_GRANT_ID,
                requestBody: {
                    to: [{ name: name, email: email }],
                    subject: 'Verify your email address!',
                    body: `
            <p>Hi ${name},</p>
        <p>Your Ridewave verification code is ${otp}. If you didn't request for this OTP, please ignore this email!</p>
        <p>Thanks,<br>Ridewave Team</p>
            `,
                },
            });
            res.status(201).json({
                success: true,
                token,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            console.log(error);
        }
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendingOtpToEmail = sendingOtpToEmail;
// verifying email otp and creating driver account
const verifyingEmailOtp = async (req, res) => {
    try {
        const { otp, token } = req.body;
        const newDriver = jsonwebtoken_1.default.verify(token, process.env.EMAIL_ACTIVATION_SECRET);
        if (newDriver.otp !== otp) {
            res.status(400).json({
                success: false,
                message: 'OTP is not correct or expired!',
            });
            return;
        }
        const { name, country, phone_number, email, vehicle_type, registration_number, registration_date, driving_license, vehicle_color, rate, } = newDriver.driver;
        const driver = await prisma_1.default.driver.create({
            data: {
                name,
                country,
                phone_number,
                email,
                vehicle_type,
                registration_number,
                registration_date,
                driving_license,
                vehicle_color,
                rate,
            },
        });
        (0, send_token_1.sendToken)(driver, res);
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: 'Your otp is expired!',
        });
    }
};
exports.verifyingEmailOtp = verifyingEmailOtp;
// get logged in driver data
const getLoggedInDriverData = async (req, res) => {
    try {
        const driver = req.driver;
        res.status(201).json({
            success: true,
            driver,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getLoggedInDriverData = getLoggedInDriverData;
// updating driver status
const updateDriverStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const driver = await prisma_1.default.driver.update({
            where: {
                id: req.driver.id,
            },
            data: {
                status,
            },
        });
        res.status(201).json({
            success: true,
            driver,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.updateDriverStatus = updateDriverStatus;
// get drivers data with id
const getDriversById = async (req, res) => {
    try {
        const { ids } = req.query;
        console.log(ids, 'ids');
        if (!ids) {
            res.status(400).json({ message: 'No driver IDs provided' });
            return;
        }
        const driverIds = ids.split(',');
        // Fetch drivers from database
        const drivers = await prisma_1.default.driver.findMany({
            where: {
                id: { in: driverIds },
            },
        });
        res.json(drivers);
    }
    catch (error) {
        console.error('Error fetching driver data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDriversById = getDriversById;
// creating new ride
const newRide = async (req, res) => {
    try {
        const { userId, charge, status, currentLocationName, destinationLocationName, distance, } = req.body;
        const newRide = await prisma_1.default.rides.create({
            data: {
                userId,
                driverId: req.driver.id,
                charge: parseFloat(charge),
                status,
                currentLocationName,
                destinationLocationName,
                distance,
            },
        });
        res.status(201).json({ success: true, newRide });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.newRide = newRide;
// updating ride status
const updatingRideStatus = async (req, res) => {
    try {
        const { rideId, rideStatus } = req.body;
        // Validate input
        if (!rideId || !rideStatus) {
            res
                .status(400)
                .json({ success: false, message: 'Invalid input data' });
            return;
        }
        const driverId = req.driver?.id;
        if (!driverId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        // Fetch the ride data to get the rideCharge
        const ride = await prisma_1.default.rides.findUnique({
            where: {
                id: rideId,
            },
        });
        if (!ride) {
            res
                .status(404)
                .json({ success: false, message: 'Ride not found' });
            return;
        }
        const rideCharge = ride.charge;
        // Update ride status
        const updatedRide = await prisma_1.default.rides.update({
            where: {
                id: rideId,
                driverId,
            },
            data: {
                status: rideStatus,
            },
        });
        if (rideStatus === 'Completed') {
            // Update driver stats if the ride is completed
            await prisma_1.default.driver.update({
                where: {
                    id: driverId,
                },
                data: {
                    totalEarning: {
                        increment: rideCharge,
                    },
                    totalRides: {
                        increment: 1,
                    },
                },
            });
        }
        res.status(201).json({
            success: true,
            updatedRide,
        });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.updatingRideStatus = updatingRideStatus;
// getting drivers rides
const getAllRides = async (req, res) => {
    const rides = await prisma_1.default.rides.findMany({
        where: {
            driverId: req.driver?.id,
        },
        include: {
            driver: true,
            user: true,
        },
    });
    res.status(201).json({
        rides,
    });
};
exports.getAllRides = getAllRides;
