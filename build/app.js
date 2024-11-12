"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nylas = exports.app = void 0;
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const nylas_1 = __importDefault(require("nylas"));
const driver_route_1 = __importDefault(require("./routes/driver.route"));
exports.app = (0, express_1.default)();
exports.nylas = new nylas_1.default({
    apiKey: process.env.NYLAS_API_KEY,
    apiUri: 'https://api.us.nylas.com',
});
// body parser
exports.app.use(express_1.default.json({ limit: '50mb' }));
// cookie parserv
exports.app.use((0, cookie_parser_1.default)());
// routes
exports.app.use('/api/v1', user_route_1.default);
exports.app.use('/api/v1/driver', driver_route_1.default);
// testing api
exports.app.get('/test', (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'API is working',
    });
});
