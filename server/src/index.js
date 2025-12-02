import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large uploads

const JWT_SECRET = process.env.JWT_SECRET || 'hercules-secret-key-change-me';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create initial user if not exists
const createInitialUser = async () => {
    const email = 'hercules@atveza.com';
    const password = 'Hercules@Sucesso#2026';

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Admin'
            }
        });
        console.log(`Created admin user: ${email}`);
    }
};

// Data Routes
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        // Fetch the latest import for the user to get metadata
        const latestImport = await prisma.import.findFirst({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });

        const orders = await prisma.serviceOrder.findMany({
            where: {
                import: { userId: req.user.id } // Filter by user
            },
            select: {
                rawData: true,
                openingDate: true,
                closingDate: true
            }
        });

        // Parse rawData back to JSON object and merge normalized dates
        const parsedOrders = orders.map(o => ({
            ...JSON.parse(o.rawData),
            openingDate: o.openingDate, // ISO string or null
            closingDate: o.closingDate  // ISO string or null
        }));

        res.json({
            orders: parsedOrders,
            metadata: latestImport ? {
                filename: latestImport.filename,
                date: latestImport.createdAt
            } : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) return res.status(400).json({ error: 'Empty file' });

        // Transaction to replace data: Delete old -> Create new
        await prisma.$transaction(async (tx) => {
            // 1. Delete all existing imports (and cascading service orders) for this user
            // Note: We need to ensure cascading delete is set up in Prisma or delete manually.
            // Since we didn't explicitly set cascading delete in schema, let's delete orders first.

            // Find all import IDs for this user
            const userImports = await tx.import.findMany({
                where: { userId: req.user.id },
                select: { id: true }
            });
            const importIds = userImports.map(i => i.id);

            if (importIds.length > 0) {
                await tx.serviceOrder.deleteMany({
                    where: { importId: { in: importIds } }
                });
                await tx.import.deleteMany({
                    where: { id: { in: importIds } }
                });
            }

            // 2. Create new Import record
            const importRecord = await tx.import.create({
                data: {
                    filename: req.file.originalname,
                    userId: req.user.id
                }
            });

            // 3. Prepare batch insert
            const serviceOrders = jsonData.map(row => {
                // Helper to parse dates
                const parseDate = (value) => {
                    if (!value) return null;

                    // Excel serial number
                    if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(value)) {
                        const serial = parseFloat(value);
                        const utc_days = Math.floor(serial - 25569);
                        const utc_value = utc_days * 86400;
                        const date_info = new Date(utc_value * 1000);
                        return new Date(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate());
                    }

                    // String format "DD/MM/YYYY" or "DD/MM/YYYY HH:mm:ss"
                    if (typeof value === 'string') {
                        const cleanStr = value.split('  ')[0].trim(); // Remove double spaces often found in these files
                        const parts = cleanStr.split(' ')[0].split('/'); // Get date part
                        if (parts.length === 3) {
                            const [day, month, year] = parts.map(Number);
                            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                return new Date(year, month - 1, day);
                            }
                        }
                    }

                    return null;
                };

                const openingDate = parseDate(row['Data Abertura']);
                const closingDate = parseDate(row['Data Fechamento']);

                return {
                    importId: importRecord.id,
                    osNumber: String(row['OS'] || row['Número OS'] || ''),
                    status: String(row['Status'] || ''),
                    product: String(row['Desc Produto'] || ''),
                    defect: String(row['Defeito Constatado'] || ''),
                    customerName: String(row['Consumidor'] || ''),
                    openingDate: openingDate,
                    closingDate: closingDate,
                    rawData: JSON.stringify(row)
                };
            });

            // 4. Batch insert
            await tx.serviceOrder.createMany({
                data: serviceOrders
            });
        }, {
            timeout: 60000 // Increase timeout to 60 seconds
        });

        res.json({ message: 'Upload successful', count: jsonData.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await createInitialUser();
});
