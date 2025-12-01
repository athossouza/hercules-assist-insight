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
        // Fetch latest import for the user? Or all?
        // For now, fetch all orders. In real app, might want pagination.
        // But the frontend expects all data for client-side filtering.
        // We'll return the rawData JSON strings.

        const orders = await prisma.serviceOrder.findMany({
            select: { rawData: true } // Only fetch rawData
        });

        // Parse rawData back to JSON object
        const parsedOrders = orders.map(o => JSON.parse(o.rawData));
        res.json(parsedOrders);
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

        // Create Import record
        const importRecord = await prisma.import.create({
            data: {
                filename: req.file.originalname,
                userId: req.user.id
            }
        });

        // Prepare batch insert
        // We store the raw row as a JSON string in 'rawData'
        // And map some core fields for potential future querying
        const serviceOrders = jsonData.map(row => ({
            importId: importRecord.id,
            osNumber: String(row['OS'] || row['Número OS'] || ''),
            status: String(row['Status'] || ''),
            product: String(row['Desc Produto'] || ''),
            defect: String(row['Defeito Constatado'] || ''),
            customerName: String(row['Consumidor'] || ''),
            rawData: JSON.stringify(row)
        }));

        // Batch insert using transaction
        // Prisma createMany is supported in SQLite
        await prisma.serviceOrder.createMany({
            data: serviceOrders
        });

        res.json({ message: 'Upload successful', count: serviceOrders.length });
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
