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
    refreshData: () => Promise<void>;
    loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [tableData, setTableData] = useState<TableData | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/data/list');
            const result = await response.json();

            if (result.success) {
                setTableData(result);
            }
        } catch (error) {
            console.error("Failed to refresh data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();

        // Auto-refresh every 5 seconds for "real-time" sync
        const interval = setInterval(refreshData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <DataContext.Provider value={{ tableData, setTableData, refreshData, loading }}>
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
