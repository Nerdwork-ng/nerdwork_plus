"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// __tests__/profile.test.ts
var supertest_1 = __importDefault(require("supertest"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var crypto_1 = __importDefault(require("crypto"));
var src_1 = require("../src");
var db_1 = require("../src/config/db");
var db = db_1.db;
jest.mock("crypto");
jest.mock("../src/config/db", function () {
    var mockDb = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
    };
    return { db: mockDb };
});
jest.mock("jsonwebtoken", function () { return ({
    verify: jest.fn(),
}); });
describe("Profile endpoints", function () {
    afterEach(function () {
        jest.clearAllMocks();
    });
    describe("POST /profile/creator", function () {
        it("should create a creator profile", function () { return __awaiter(void 0, void 0, void 0, function () {
            var fakeProfile, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fakeProfile = {
                            id: 1,
                            userId: "user123",
                            fullName: "John Doe",
                            creatorName: "JD Comics",
                            phoneNumber: "1234567890",
                            bio: "I make comics",
                            genres: ["fantasy", "action"],
                        };
                        db.returning.mockResolvedValueOnce([fakeProfile]);
                        return [4 /*yield*/, (0, supertest_1.default)(src_1.app)
                                .post("/profile/creator")
                                .send({
                                userId: "user123",
                                fullName: "John Doe",
                                creatorName: "JD Comics",
                                phoneNumber: "1234567890",
                                bio: "I make comics",
                                genres: ["fantasy", "action"],
                            })];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(200);
                        expect(res.body.profile).toEqual(fakeProfile);
                        return [2 /*return*/];
                }
            });
        }); });
        it("should return 400 if db insert fails", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db.returning.mockRejectedValueOnce(new Error("DB error"));
                        return [4 /*yield*/, (0, supertest_1.default)(src_1.app)
                                .post("/profile/creator")
                                .send({
                                userId: "user123",
                                fullName: "John Doe",
                                creatorName: "JD Comics",
                                phoneNumber: "1234567890",
                                bio: "I make comics",
                                genres: ["fantasy", "action"],
                            })];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(400);
                        expect(res.body.message).toBe("Failed to create creator profile");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("POST /profile/reader", function () {
        it("should create a reader profile with walletId + hashed pin", function () { return __awaiter(void 0, void 0, void 0, function () {
            var fakeProfile, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fakeProfile = {
                            id: 2,
                            userId: "user456",
                            genres: ["romance"],
                            walletId: "wallet123",
                            pinHash: "hashed-pin",
                        };
                        // Mock crypto
                        jest.spyOn(crypto_1.default, "randomBytes").mockImplementation(function () {
                            return Buffer.from("wallet123wallet123"); // 16 bytes
                        });
                        jest.spyOn(crypto_1.default, "createHash").mockReturnValue({
                            update: jest.fn().mockReturnThis(),
                            digest: jest.fn().mockReturnValue("hashed-pin"),
                        });
                        db.returning.mockResolvedValueOnce([fakeProfile]);
                        return [4 /*yield*/, (0, supertest_1.default)(src_1.app)
                                .post("/profile/reader")
                                .send({
                                userId: "user456",
                                genres: ["romance"],
                                pin: "1234",
                            })];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(200);
                        expect(res.body.profile).toEqual(fakeProfile);
                        return [2 /*return*/];
                }
            });
        }); });
        it("should return 400 if db insert fails", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db.returning.mockRejectedValueOnce(new Error("DB error"));
                        return [4 /*yield*/, (0, supertest_1.default)(src_1.app)
                                .post("/profile/reader")
                                .send({
                                userId: "user456",
                                genres: ["romance"],
                                pin: "1234",
                            })];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(400);
                        expect(res.body.message).toBe("Failed to create reader profile");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("GET /profile", function () {
        it("should return creator profile when exists", function () { return __awaiter(void 0, void 0, void 0, function () {
            var fakeCreator, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fakeCreator = { id: 1, userId: "u1", creatorName: "JD" };
                        jsonwebtoken_1.default.verify.mockReturnValue({ userId: "u1" });
                        db.where.mockResolvedValueOnce([fakeCreator]); // first query returns creator
                        return [4 /*yield*/, (0, supertest_1.default)(src_1.app)
                                .get("/profile")
                                .set("Authorization", "Bearer validtoken")];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(200);
                        expect(res.body).toEqual({ role: "creator", profile: fakeCreator });
                        return [2 /*return*/];
                }
            });
        }); });
        it("should return reader profile when creator not found", function () { return __awaiter(void 0, void 0, void 0, function () {
            var fakeReader, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fakeReader = { id: 2, userId: "u2", genres: ["sci-fi"] };
                        jsonwebtoken_1.default.verify.mockReturnValue({ userId: "u2" });
                        db.where
                            .mockResolvedValueOnce([]) // no creator
                            .mockResolvedValueOnce([fakeReader]); // reader found
                        return [4 /*yield*/, (0, supertest_1.default)(src_1.app)
                                .get("/profile")
                                .set("Authorization", "Bearer validtoken")];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(200);
                        expect(res.body).toEqual({ role: "reader", profile: fakeReader });
                        return [2 /*return*/];
                }
            });
        }); });
        it("should return 404 if no profile found", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jsonwebtoken_1.default.verify.mockReturnValue({ userId: "u3" });
                        db.where
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([]);
                        return [4 /*yield*/, (0, supertest_1.default)(src_1.app)
                                .get("/profile")
                                .set("Authorization", "Bearer validtoken")];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(404);
                        expect(res.body.message).toBe("Profile not found");
                        return [2 /*return*/];
                }
            });
        }); });
        it("should return 401 if no token provided", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(src_1.app).get("/profile")];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(401);
                        return [2 /*return*/];
                }
            });
        }); });
        it("should return 401 if token is invalid", function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        jsonwebtoken_1.default.verify.mockImplementation(function () {
                            throw new Error("invalid");
                        });
                        return [4 /*yield*/, (0, supertest_1.default)(src_1.app)
                                .get("/profile")
                                .set("Authorization", "Bearer badtoken")];
                    case 1:
                        res = _a.sent();
                        expect(res.status).toBe(401);
                        expect(res.body.message).toBe("Invalid or expired token");
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
