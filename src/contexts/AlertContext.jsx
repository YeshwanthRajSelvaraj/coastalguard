import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as alertService from '../services/alertService';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [alerts, setAlerts] = useState([]);

    // Subscribe to real-time alert updates
    useEffect(() => {
        // Initial load
        setAlerts(alertService.fetchAlerts());

        // Subscribe to updates (same-tab, cross-tab, polling)
        const unsub = alertService.subscribeToAlerts((updated) => {
            setAlerts([...updated]);
        });

        return unsub;
    }, []);

    const sendSOS = useCallback((data) => {
        const alert = alertService.sendSOSAlert(data);
        return alert;
    }, []);

    const sendBorder = useCallback((data) => {
        const alert = alertService.sendBorderAlert(data);
        return alert;
    }, []);

    const acknowledge = useCallback((id) => {
        alertService.acknowledgeAlert(id);
    }, []);

    const resolve = useCallback((id) => {
        alertService.resolveAlert(id);
    }, []);

    const acknowledgeAll = useCallback(() => {
        alertService.acknowledgeAllPending();
    }, []);

    const resolveAll = useCallback(() => {
        alertService.resolveAllAlerts();
    }, []);

    const pendingCount = alerts.filter((a) => a.status === 'pending').length;
    const activeCount = alerts.filter((a) => a.status !== 'resolved').length;

    const value = {
        alerts,
        sendSOS,
        sendBorder,
        acknowledge,
        resolve,
        acknowledgeAll,
        resolveAll,
        pendingCount,
        activeCount,
    };

    return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts() {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
    return ctx;
}
