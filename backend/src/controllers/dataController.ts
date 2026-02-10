import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma';

export const getRoot = (req: Request, res: Response) => {
    res.json({ message: "Hello from TypeScript Backend!" });
};

export const getData = async (req: Request, res: Response) => {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: {
                id: 'asc'
            }
        });

        // Map data to the format expected by the frontend
        if (employees.length > 0) {
            const columns = Object.keys(employees[0]).filter(key => key !== 'id');
            res.json({
                success: true,
                columns: columns,
                data: employees,
                row_count: employees.length
            });
        } else {
            res.json({
                success: true,
                columns: [],
                data: [],
                row_count: 0
            });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
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

        // Get headers from the first row and normalize them
        const headers: string[] = [];
        const firstRow = worksheet.getRow(1);
        firstRow.eachCell((cell, colNumber) => {
            // Normalize header: lowercase, trim, and replace spaces with underscores to match DB schema
            let header = cell.value?.toString().toLowerCase().trim().replace(/\s+/g, '_') || `column${colNumber}`;

            // Map 'ready' to 'tc_result' to match Prisma schema
            if (header === 'ready') {
                header = 'tc_result';
            }

            headers[colNumber - 1] = header;
        });

        // Ensure availability_status is part of the headers for frontend display
        if (!headers.includes('availability_status')) {
            headers.push('availability_status');
        }

        // Get data rows (starting from row 2)
        const employees: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const employeeData: any = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    let value = cell.value;

                    // Handle formula cells
                    if (value && typeof value === 'object' && 'result' in value) {
                        value = (value as any).result;
                    }

                    // Type casting to match Prisma Schema
                    if (header === 'no' || header === 'bp') {
                        if (value === null || value === undefined || value === '') {
                            value = 0;
                        } else {
                            const parsed = parseInt(value.toString().replace(/[^0-9]/g, ''));
                            value = isNaN(parsed) ? 0 : parsed;
                        }
                    } else if (header === 'nik' || header === 'phone') {
                        value = value ? value.toString().trim() : (header === 'phone' ? null : '');
                    } else {
                        value = value ? value.toString().trim() : '';
                    }

                    employeeData[header] = value;
                }
            });

            // Ensure availability_status has a default if missing or empty
            if (!employeeData.availability_status) {
                employeeData.availability_status = "Not Yet Contacted";
            }

            // Only add if we have at least some data and required fields are present
            if (Object.keys(employeeData).length > 0 && (employeeData.nama || employeeData.nik)) {
                employees.push(employeeData);
            }
        });

        if (employees.length === 0) {
            return res.status(400).json({ success: false, error: "No valid data found in Excel" });
        }

        // SAVE TO DATABASE
        // Changed skipDuplicates to true because NIK and Phone are now UNIQUE
        const result = await prisma.employee.createMany({
            data: employees,
            skipDuplicates: true
        });

        res.json({
            success: true,
            message: `${result.count} employees saved successfully`,
            columns: headers,
            data: employees,
            row_count: employees.length
        });
    } catch (error: any) {
        console.error("Upload error:", error);
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
