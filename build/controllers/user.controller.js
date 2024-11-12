"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRides = exports.getLoggedInUserData = exports.verifyingEmail = exports.sendingOtpToEmail = exports.verifyOtp = exports.registerUser = void 0;
require('dotenv').config();
const twilio_1 = __importDefault(require("twilio"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const send_token_1 = require("../utils/send-token");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../app");
// Set up Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (0, twilio_1.default)(accountSid, authToken, {
    lazyLoading: true,
});
// register new user
const registerUser = async (req, res, next) => {
    try {
        const { phone_number } = req.body;
        console.log("server:", phone_number);
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
exports.registerUser = registerUser;
// verify otp
const verifyOtp = async (req, res, next) => {
    try {
        const { phone_number, otp } = req.body;
        try {
            await client.verify.v2
                .services(process.env.TWILIO_SERVICE_SID)
                .verificationChecks.create({
                to: phone_number,
                code: otp,
            });
            // is user exist
            const isUserExist = await prisma_1.default.user.findUnique({
                where: {
                    phone_number,
                },
            });
            if (isUserExist) {
                await (0, send_token_1.sendToken)(isUserExist, res);
            }
            else {
                // create account
                const user = await prisma_1.default.user.create({
                    data: {
                        phone_number: phone_number,
                    },
                });
                res.status(200).json({
                    success: true,
                    message: 'OTP verified successfully!',
                    user: user,
                });
            }
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
exports.verifyOtp = verifyOtp;
// sending otp to email
const sendingOtpToEmail = async (req, res, next) => {
    try {
        const { email, name, userId } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const user = {
            userId,
            name,
            email,
        };
        const token = jsonwebtoken_1.default.sign({
            user,
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
          <div style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Ridewave</h1>
        </div>
        
        <div style="padding: 30px 20px;">
            <p style="margin: 0 0 20px 0;">Hi ${name},</p>
            
            <p style="margin: 0 0 20px 0;">Your Ridewave verification code is:</p>
            
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center; font-size: 24px; letter-spacing: 2px;">
                ${otp}
            </div>
            
            <p style="margin: 20px 0; color: #666666; font-style: italic; font-size: 14px;">If you didn't request for this OTP, please ignore this email!</p>
        </div>
        
        <div style="padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="margin: 0; color: #666666;">Thanks,<br>Ridewave Team</p>
        </div>
    </div>
</div>
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
// verifying email otp
const verifyingEmail = async (req, res, next) => {
    try {
        const { otp, token } = req.body;
        const newUser = jsonwebtoken_1.default.verify(token, process.env.EMAIL_ACTIVATION_SECRET);
        if (newUser.otp !== otp) {
            res.status(400).json({
                success: false,
                message: 'OTP is not correct or expired!',
            });
        }
        const { name, email, userId } = newUser.user;
        const user = await prisma_1.default.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (user?.email === null) {
            const updatedUser = await prisma_1.default.user.update({
                where: {
                    id: userId,
                },
                data: {
                    name: name,
                    email: email,
                },
            });
            await (0, send_token_1.sendToken)(updatedUser, res);
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Email Already Exists!',
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: 'Your otp is expired!',
        });
    }
};
exports.verifyingEmail = verifyingEmail;
// get logged in user data
const getLoggedInUserData = async (req, res) => {
    try {
        const user = req.user;
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getLoggedInUserData = getLoggedInUserData;
// getting user rides
const getAllRides = async (req, res) => {
    const rides = await prisma_1.default.rides.findMany({
        where: {
            userId: req.user?.id,
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
