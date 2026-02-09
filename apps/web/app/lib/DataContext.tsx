'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TableData {
    columns: string[];
    data: any[];
    row_count: number;
}

interface DataContextType {
    tableData: TableData | null;
    setTableData: (data: TableData | null) => void;
    loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [tableData, setTableData] = useState<TableData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/data/list');
                const result = await response.json();

                if (result.success && result.row_count > 0) {
                    setTableData(result);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <DataContext.Provider value={{ tableData, setTableData, loading }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
