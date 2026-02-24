export const keywordAnalysisService = {
    analyze(message: string) {
        const text = message.toLowerCase();

        const rejectionWords = ['reject', 'no', 'cancel', 'unable', 'cannot', 'tolak', 'tidak bisa', 'batal', 'halangan', 'maaf'];
        const rescheduleWords = ['reschedule', 'change date', 'postpone', 'jadwal ulang', 'ganti tanggal', 'tunda', 'undur', 'minggu depan', 'pindah jam'];
        const acceptanceWords = ['accept', 'yes', 'confirm', 'ok', 'sure', 'setuju', 'bisa', 'siap', 'konfirmasi', 'oke', 'baik', 'hadir'];

        if (rejectionWords.some(word => text.includes(word))) {
            return {
                status: 'rejected',
                reason: 'Backend detected rejection keywords',
                proposedDate: '',
                replyMessage: ''
            };
        }

        if (rescheduleWords.some(word => text.includes(word))) {
            return {
                status: 'reschedule',
                reason: 'Backend detected reschedule keywords',
                proposedDate: '',
                replyMessage: 'Mohon maaf, silakan berikan tanggal dan waktu yang diusulkan untuk penjadwalan ulang.'
            };
        }

        if (acceptanceWords.some(word => text.includes(word))) {
            return {
                status: 'accepted',
                reason: 'Backend detected acceptance keywords',
                proposedDate: '',
                replyMessage: ''
            };
        }

        return {
            status: 'unknown',
            reason: 'No keywords matched in backend fallback',
            proposedDate: '',
            replyMessage: ''
        };
    }
};
