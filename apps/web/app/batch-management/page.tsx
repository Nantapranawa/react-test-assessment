'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

export default function BatchManagementRedirect() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            router.push('/batch-management/talent-solution-1');
        } else if (user?.talent_solution === 2) {
            router.push('/batch-management/talent-solution-2');
        } else {
            router.push('/batch-management/talent-solution-1');
        }
    }, [user, router]);

    return <div className="p-10 text-center text-zinc-500">Redirecting...</div>;
}
