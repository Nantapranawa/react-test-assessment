'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TableData {
    columns: string[];
    data: any[];
    row_count: number;
}

interface DataContextType {
    tableData: TableData | null;
    setTableData: (data: TableData | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [tableData, setTableData] = useState<TableData | null>(null);

    return (
        <DataContext.Provider value={{ tableData, setTableData }}>
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
