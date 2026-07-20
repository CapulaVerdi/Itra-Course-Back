import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AttributeDataType, AttributeCategory } from "../generated/prisma/client.js"

const router = express.Router();

router.get('/', async (req, res) => {
    const attributes = await prisma.attribute.findMany();
    res.json(attributes)
})

router.post('/', requireAuth, requireRole("ADMIN", "RECRUITER"), async (req, res) => {
    if (!req.body.name) {res.status(400).json("no attribute name"); return}
    if (!req.body.description) {res.status(400).json("no attribute description"); return}
    if (!AttributeDataType[req.body.dataType]) {res.status(400).json("wrong data type"); return}
    if (!AttributeCategory[req.body.category]) {res.status(400).json("wrong category"); return}
    if (req.body.dataType === AttributeDataType.ONE_OF_MANY && !Array.isArray(req.body.options)) {res.status(400).json("no options for one of many"); return}
    if (req.body.dataType !== AttributeDataType.ONE_OF_MANY && req.body.options) {res.status(400).json("this data type not allow options"); return}

    const created = await prisma.attribute.create({
        data: {
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            dataType: req.body.dataType,
            options: req.body.dataType === AttributeDataType.ONE_OF_MANY ? req.body.options : undefined
        }
    })

    res.status(201).json(created)
})

router.patch('/:id', requireAuth, requireRole("ADMIN", "RECRUITER"), async (req, res) => {
    if (!req.body.version) {res.status(400).json("version is required"); return}
    if (req.body.dataType !== undefined) {res.status(400).json("dataType is immutable"); return}
    if (req.body.category !== undefined && !AttributeCategory[req.body.category]) {res.status(400).json({ error: "wrong category" }); return}
    
    const result = await prisma.attribute.updateMany({
        where: {
            id: Number(req.params.id), 
            version: Number(req.body.version),
            isBuiltIn: false
        },
        data: {
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            version: { increment: 1 }
        }
    })

    const updatedAttribute = await prisma.attribute.findUnique({
        where: {
            id: Number(req.params.id)
        }
    })

    if (result.count === 1) {
        res.status(200).json(updatedAttribute)
    } else {
        updatedAttribute ? res.status(409).json(updatedAttribute) : res.status(404).json("attribute not found")
    }
    
})

router.delete('/:id', requireAuth, requireRole("ADMIN", "RECRUITER"), async (req, res) => {
    const result = await prisma.attribute.deleteMany({
        where: {
            id: Number(req.params.id),
            isBuiltIn: false
        }
    })

    if (result.count === 1) {
        res.status(204).json("success")
    } else {
        const deletedAttribute = await prisma.attribute.findUnique({
            where: { id: Number(req.params.id) }
        })
        if (!deletedAttribute) {
            res.status(404).json("not found")
        } else {
            res.status(403).json("forbidden")
        }
    }

    
})

export default router