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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
var AIService = /** @class */ (function () {
    function AIService() {
    }
    /**
     * Panggil LLM provider (Flaz Cloud / OpenAI-compatible endpoint)
     */
    AIService.generateReply = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var baseUrl, url, controller_1, timeoutId, res, data, reply, tokenUsage, error_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 3, , 4]);
                        if (!config.apiKey) {
                            throw new Error('API Key tidak ditemukan.');
                        }
                        baseUrl = process.env.AI_BASE_URL || 'https://ai.flaz.id/v1';
                        url = "".concat(baseUrl.replace(/\/$/, ''), "/chat/completions");
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, 30000);
                        console.log('--- AI_SERVICE_CALL ---');
                        console.log('Using Model:', config.model || 'gpt-4o-mini');
                        console.log('Using Provider:', config.provider);
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                signal: controller_1.signal,
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: "Bearer ".concat(config.apiKey),
                                },
                                body: JSON.stringify({
                                    model: config.model || 'gpt-4o-mini',
                                    messages: __spreadArray(__spreadArray([
                                        { role: 'system', content: config.systemPrompt }
                                    ], (config.chatHistory || []), true), [
                                        {
                                            role: 'user',
                                            content: config.imageUrl
                                                ? [
                                                    { type: 'text', text: config.userMessage || 'Tolong jelaskan gambar ini berdasarkan konteks bisnis kita.' },
                                                    { type: 'image_url', image_url: { url: config.imageUrl } }
                                                ]
                                                : config.userMessage
                                        },
                                    ], false),
                                    max_tokens: config.maxTokens || 1500,
                                    temperature: 0.7,
                                }),
                                // Add timeout via AbortController if supported in edge/node, or just rely on platform defaults
                            })];
                    case 1:
                        res = _e.sent();
                        clearTimeout(timeoutId);
                        if (!res.ok) {
                            console.error('AI API Error Status:', res.status);
                            throw new Error('Gagal menghubungi AI provider.');
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _e.sent();
                        reply = ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '';
                        tokenUsage = ((_d = data.usage) === null || _d === void 0 ? void 0 : _d.total_tokens) || 0;
                        return [2 /*return*/, { reply: reply, tokenUsage: tokenUsage }];
                    case 3:
                        error_1 = _e.sent();
                        if (error_1.name === 'AbortError') {
                            console.error('AI Generation Timeout (30s limit)');
                            throw new Error('Waktu respon AI habis (timeout).');
                        }
                        console.error('AI Generation Error:', error_1.message);
                        throw new Error('Kesalahan internal sistem AI.');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AIService.sanitizeInput = function (text) {
        if (!text)
            return '';
        var cleaned = text.slice(0, 2000); // Batas aman pesan masuk
        cleaned = cleaned.replace(/<[^>]*>?/gm, ''); // Hapus HTML
        cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Hapus control chars
        cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n'); // Normalize whitespace
        cleaned = cleaned.replace(/ {4,}/g, '   ');
        cleaned = cleaned.replace(/(.)\1{20,}/g, '$1$1$1$1$1'); // Block spam text
        return cleaned.trim();
    };
    return AIService;
}());
exports.AIService = AIService;
