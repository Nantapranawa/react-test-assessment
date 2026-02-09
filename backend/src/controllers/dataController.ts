import { Request, Response } from 'express';
import ExcelJS from 'exceljs';

export const getRoot = (req: Request, res: Response) => {
    res.json({ message: "Hello from TypeScript Backend!" });
};

export const getData = (req: Request, res: Response) => {
    res.json({ users: ["Alice", "Bob", "Charlie"] });
};

export const uploadExcel = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer as any);

        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            return res.status(400).json({ success: false, error: "No worksheet found in the file" });
        }

        // Get headers from the first row
        const headers: string[] = [];
        const firstRow = worksheet.getRow(1);
        firstRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || `Column${colNumber}`;
        });

        // Get data rows (starting from row 2)
        const data: Record<string, any>[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const rowData: Record<string, any> = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    // Handle different cell value types
                    let value = cell.value;
                    if (value && typeof value === 'object' && 'result' in value) {
                        // Handle formula cells - use the calculated result
                        value = value.result;
                    }
                    rowData[header] = value ?? null;
                }
            });

            // Ensure all headers have a value (even if null)
            headers.forEach(header => {
                if (!(header in rowData)) {
                    rowData[header] = null;
                }
            });

            data.push(rowData);
        });

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
