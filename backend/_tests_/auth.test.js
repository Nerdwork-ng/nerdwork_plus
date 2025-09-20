"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// __tests__/auth.test.ts
var supertest_1 = __importDefault(require("supertest"));
var src_1 = require("../src");
var authController = __importStar(require("../src/controller/auth.controller"));
var db_1 = require("../src/config/db");
var db = db_1.db;
// Mock google-auth-library (like before)
jest.mock("google-auth-library", function () {
    return {
        OAuth2Client: jest.fn().mockImplementation(function () {
            return {
                verifyIdToken: jest.fn().mockResolvedValue({
                    getPayload: function () { return ({
                        email: "testuser@example.com",
                        sub: "google-oauth-id-123",
                        email_verified: true,
                        picture: "https://test.com/avatar.png",
                    }); },
                }),
            };
        }),
    };
});
// Mock Drizzle DB
// jest.mock("../src/config/db", () => {
//   return {
//     db: {
//       insert: jest.fn().mockReturnThis(),
//       values: jest.fn().mockReturnThis(),
//       returning: jest.fn().mockResolvedValue([
//         {
//           id: "uuid-123",
//           email: "testuser@example.com",
//           username: "testuser",
//           passwordHash: "hashed",
//           emailVerified: true,
//           isActive: true,
//         },
//       ]),
//       select: jest.fn().mockReturnThis(),
//       from: jest.fn().mockReturnThis(),
//       where: jest.fn().mockReturnThis(),
//       limit: jest.fn().mockReturnThis(),
//       execute: jest.fn().mockResolvedValue([
//         {
//           id: "uuid-123",
//           email: "testuser@example.com",
//           username: "testuser",
//           passwordHash: "hashed",
//           emailVerified: true,
//           isActive: true,
//         },
//       ]),
//     },
//   };
// });
beforeEach(function () {
    jest.clearAllMocks();
});
jest.mock("../src/config/db", function () {
    var fakeUser = {
        id: "uuid-123",
        email: "testuser@example.com",
        username: "testuser",
        passwordHash: "hashed",
        emailVerified: true,
        isActive: true,
    };
    return {
        db: {
            insert: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([fakeUser]),
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn(), // <-- don’t resolve globally
            limit: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue([]),
        },
    };
});
// mock google token verification
jest.spyOn(authController, "verifyGoogleToken").mockResolvedValue({
    email: "testuser@example.com",
    fullName: "Test User",
    picture: "",
    googleId: "mock-google-id",
});
describe("Auth Routes (Google)", function () {
    var googlePayload = { idToken: "fake-test-id-token" };
    beforeEach(function () {
        jest.clearAllMocks();
    });
    it("should sign up a user with Google", function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Signup: user does NOT exist yet
                    db.where.mockResolvedValueOnce([]); // empty result
                    return [4 /*yield*/, (0, supertest_1.default)(src_1.app).post("/auth/signup").send(googlePayload)];
                case 1:
                    res = _a.sent();
                    expect(res.statusCode).toBe(200);
                    expect(res.body).toHaveProperty("user");
                    expect(res.body.user).toHaveProperty("email", "testuser@example.com");
                    expect(res.body).toHaveProperty("token");
                    return [2 /*return*/];
            }
        });
    }); });
    it("should login a user with Google", function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // First signup (user doesn't exist)
                    db.where.mockResolvedValueOnce([]);
                    return [4 /*yield*/, (0, supertest_1.default)(src_1.app).post("/auth/signup").send(googlePayload)];
                case 1:
                    _a.sent();
                    // Login: user DOES exist
                    db.where.mockResolvedValueOnce([
                        {
                            id: "uuid-123",
                            email: "testuser@example.com",
                            username: "testuser",
                            passwordHash: "hashed",
                            emailVerified: true,
                            isActive: true,
                        },
                    ]);
                    return [4 /*yield*/, (0, supertest_1.default)(src_1.app).post("/auth/login").send(googlePayload)];
                case 2:
                    res = _a.sent();
                    expect(res.statusCode).toBe(200);
                    expect(res.body).toHaveProperty("user");
                    expect(res.body).toHaveProperty("token");
                    return [2 /*return*/];
            }
        });
    }); });
});
