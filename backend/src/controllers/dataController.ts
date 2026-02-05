import { Request, Response } from 'express';
import * as XLSX from 'xlsx';

export const getRoot = (req: Request, res: Response) => {
    res.json({ message: "Hello from TypeScript Backend!" });
};

export const getData = (req: Request, res: Response) => {
    res.json({ users: ["Alice", "Bob", "Charlie"] });
};

export const uploadExcel = (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use defval: null to match Python's fillna behavior for numeric columns if needed
        const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

        // Get columns from the header row
        const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];

        res.json({
            success: true,
            columns: headers,
            data: data,
            row_count: data.length
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const processData = (req: Request, res: Response) => {
    try {
        const data = req.body;
        res.json({
            success: true,
            processed_data: data,
            message: "Data processed successfully"
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
