"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDecimal = toDecimal;
exports.toNumber = toNumber;
const client_1 = require("@prisma/client");
function toDecimal(value) {
    return new client_1.Prisma.Decimal(value);
}
function toNumber(value) {
    if (value == null)
        return 0;
    return typeof value === "number" ? value : value.toNumber();
}
