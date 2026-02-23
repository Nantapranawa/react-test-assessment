'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import { useAuth } from './AuthContext';
import { usePathname } from 'next/navigation';

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
    const { user } = useAuth();
    const pathname = usePathname();

    const refreshData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            let url = 'http://localhost:8000/api/data/list';

            if (user) {
                const params = new URLSearchParams();

                // ADMIN logic: View based on current path
                if (user.role === 'ADMIN') {
                    if (pathname.includes('/talent-management/talent-solution-1') || pathname.includes('/batch-management/talent-solution-1')) {
                        params.append('talent_solution', '1');
                    } else if (pathname.includes('/talent-management/talent-solution-2') || pathname.includes('/batch-management/talent-solution-2')) {
                        params.append('talent_solution', '2');
                    } else {
                        // Admin on dashboard or other pages sees everything
                        params.append('talent_solution', 'all');
                    }
                } else {
                    // Regular User logic: view their own TS data
                    params.append('talent_solution', user.talent_solution.toString());
                }

                const queryString = params.toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setTableData(result);
            }
        } catch (error) {
            console.error("Failed to refresh data:", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            refreshData(true); // Show loading when path or user changes
        }

        // Auto-refresh every 5 seconds for "real-time" sync
        const interval = setInterval(() => {
            if (user) refreshData(false); // Background refresh - don't show loading
        }, 5000);

        return () => clearInterval(interval);
    }, [user, pathname]);

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
