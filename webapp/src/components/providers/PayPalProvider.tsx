'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useSettingsStore } from '@/lib/store';
import { ReactNode, useMemo } from 'react';

interface PayPalProviderProps {
    children: ReactNode;
}

export default function PayPalProvider({ children }: PayPalProviderProps) {
    const { settings } = useSettingsStore();

    const paypalOptions = useMemo(() => ({
        clientId: settings?.paypal_client_id || "test", // Fallback to "test" for sandbox if not set
        currency: "USD",
        intent: "capture",
        components: "buttons",
        enableFunding: "card", // Explicitly enable card funding
        locale: "es_MX" // Using Mexico locale to ensure "Ciudad" instead of "Población"
    }), [settings?.paypal_client_id]);

    // If we don't have settings yet, just render children to avoid blocking
    if (!settings) {
        return <>{children}</>;
    }

    return (
        <PayPalScriptProvider options={paypalOptions}>
            {children}
        </PayPalScriptProvider>
    );
}
