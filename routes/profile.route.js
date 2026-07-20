import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AttributeDataType, AttributeCategory } from "../generated/prisma/client.js"

const router = express.Router();

router.get("/", requireAuth, requireRole("ADMIN", "RECRUITER", "CANDIDATE"), async (req, res) => {
    const attributes = await prisma.attribute.findMany({
        where: {
            OR: [
                { isBuiltIn: true },
                { attributeValues: { some: { userId: req.user.id } } }
            ]
        },
        include: {
            attributeValues: {
                where: { userId: req.user.id}
            }
        }
    })

    if ( attributes ) {
        res.status(200).json(attributes);
    } else {
        res.status(404).json("not found");
    }
})

router.patch("/", requireAuth, requireRole("ADMIN", "RECRUITER", "CANDIDATE"), async (req, res) => {
    const { changes } = req.body;
    const versionError = new Error("version conflict");
    versionError.code = "v409";

    if (!changes || !Array.isArray(changes) || changes.length === 0) {res.status(400).json("bad request"); return}
    for (const change of changes) {
        if (!change.attributeId || !Number.isInteger(change.attributeId)) {res.status(400).json("bad request"); return}
        if (change.value === undefined) {res.status(400).json("bad request"); return}
    }

    const dataTypeToValue = {
        STRING: "valueString",
        NUMBER: "valueNumber",
        BOOLEAN: "valueBoolean",
        DATE: "valueDate",
        ONE_OF_MANY: "valueString",
        TEXT: "valueString",
        IMAGE: "valueString"
    }

    const attributesIds = changes.map((c) => c.attributeId)

    const attribute = await prisma.attribute.findMany({
        where: {
            id: { in: attributesIds }
        }
    });
    const attributeMap = new Map(attribute.map(obj => [obj.id, obj]));

    const existing = await prisma.attributeValue.findMany({
        where: {
            userId: req.user.id,
            attributeId: { in: attributesIds }
        }
    })
    const existingMap = new Map(existing.map(obj => [obj.attributeId, obj]));

    for (const change of changes) {
        if (attributeMap.get(change.attributeId) === undefined) {res.status(400).json("bad request"); return}
    }

    const result = await prisma.$transaction(async (tx) => {
        const out = [];

        for (const change of changes) {
            const attribute = attributeMap.get(change.attributeId);
            const existingValue = existingMap.get(change.attributeId)
            let valueData;
            if (attribute.dataType === "PERIOD") {
                valueData = { valuePeriodStart: change.value.start, valuePeriodEnd: change.value.end };
            } else {
                const column = dataTypeToValue[attribute.dataType];
                valueData = { [column]: change.value };
            }
            
            if (!existingValue) {
                await tx.attributeValue.create({
                    data: {
                        userId: req.user.id,
                        attributeId: change.attributeId,
                        ...valueData,
                        version: 1,
                    }
                })
                out.push({attributeId: change.attributeId, version: 1})
            } else if (change.version === existingValue.version) {
                const updateResult = await tx.attributeValue.updateMany({
                    where: {
                        id: existingValue.id,
                        version: change.version,
                    },
                    data: {
                        ...valueData,
                        version: { increment: 1}
                    }
                })
                if (updateResult.count === 0) {
                    throw versionError
                }
                if (updateResult.count === 1) {
                    out.push({attributeId: change.attributeId, version: existingValue.version + 1})
                }
            } else {
                throw versionError;
            }
        }
        return out;
    })

    res.status(200).json({changes: result})
})

export default router