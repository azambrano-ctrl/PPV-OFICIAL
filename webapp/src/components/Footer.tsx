"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin } from 'lucide-react';
import { useSettingsStore } from '@/lib/store';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { newsletterAPI, handleAPIError } from '@/lib/api';
import AdSense from '@/components/ui/AdSense';

import toast from 'react-hot-toast';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const { settings, hasHydrated } = useSettingsStore();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);


    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSubscribing(true);
        try {
            const response = await newsletterAPI.subscribe(email);
            toast.success(response.data.message || t('footer.newsletter.success'));
            setEmail('');
        } catch (error) {

            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setSubscribing(false);
        }
    };

    const footerLinks = {
        company: [
            { label: t('nav.about'), href: '/about' },
            { label: t('nav.events'), href: '/events' },
            { label: t('nav.promoters'), href: '/promoters' },
        ],
        legal: [
            { label: 'Términos de Servicio', href: '/terms' },
            { label: 'Política de Privacidad', href: '/privacy' },
            { label: 'Política de Reembolsos', href: '/refunds' },
            { label: 'Política DMCA', href: '/dmca' },
        ],
        support: [
            { label: 'Centro de Ayuda', href: '/help' },
            { label: 'FAQ', href: '/faq' },
            { label: 'Soporte Técnico', href: '/support' },
        ],
    };


    const socialLinks = [
        { icon: Facebook, href: 'https://facebook.com/arenafightpass', label: 'Facebook' },
        { icon: Instagram, href: 'https://instagram.com/arenafightpass', label: 'Instagram' },
        { icon: Youtube, href: 'https://youtube.com/@arenafightpass', label: 'YouTube' },
        {
            icon: () => (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
            ),
            href: 'https://tiktok.com/@arenafightpass',
            label: 'TikTok'
        },
    ];

    return (
        <footer className="bg-dark-900 border-t border-dark-800">
            {/* Ad Space Section */}
            <div className="container-custom py-6 flex justify-center border-b border-dark-800/50">
                <div className="w-full max-w-5xl rounded-xl overflow-hidden bg-dark-950/50 border border-white/5 flex items-center justify-center min-h-[90px]">
                    <AdSense slot="5992307942" format="horizontal" className="!my-0 w-full" />
                </div>
            </div>

            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2 mb-4 group">
                            {!hasHydrated ? (
                                <div className="w-10 h-10 bg-dark-800 rounded-lg animate-pulse" />
                            ) : settings?.site_logo ? (
                                <div
                                    className="transition-transform group-hover:scale-105 flex items-center justify-center"
                                    style={{
                                        width: settings.site_logo_width ? `${settings.site_logo_width}px` : '40px',
                                        transform: `translate(${settings.site_logo_offset_x || 0}px, ${settings.site_logo_offset_y || 0}px)`
                                    }}
                                >
                                    <img
                                        src={settings.site_logo}
                                        alt={settings?.site_name || ''}
                                        className="max-w-full h-auto object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <span className="text-white font-bold text-xl">
                                        {settings?.site_name?.charAt(0) || 'P'}
                                    </span>
                                </div>
                            )}
                            {hasHydrated && (
                                <span className="font-display font-bold text-xl gradient-text">
                                    {settings?.site_name}
                                </span>
                            )}
                        </Link>
                        <p className="text-dark-400 mb-6 max-w-sm">
                            {settings?.site_description || t('footer.description')}
                        </p>

                        <div className="flex space-x-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-dark-800 hover:bg-primary-600 flex items-center justify-center transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">{t('footer.company')}</h3>

                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-dark-400 hover:text-primary-500 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">{t('footer.legal')}</h3>

                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-dark-400 hover:text-primary-500 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">{t('footer.support')}</h3>

                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-dark-400 hover:text-primary-500 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Newsletter */}
                <div className="mt-12 pt-8 border-t border-dark-800">
                    <div className="max-w-md">
                        <h3 className="font-semibold text-white mb-2">
                            {t('footer.newsletter.title')}
                        </h3>
                        <p className="text-dark-400 text-sm mb-4">
                            {t('footer.newsletter.description')}
                        </p>

                        <form onSubmit={handleSubscribe} className="flex gap-2">
                            <input
                                type="email"
                                placeholder={t('footer.newsletter.placeholder')}
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input flex-1"
                                disabled={subscribing}
                            />

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={subscribing}
                            >
                                {subscribing ? (
                                    <div className="spinner w-5 h-5" />
                                ) : (
                                    <Mail className="w-5 h-5" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 pt-8 border-t border-dark-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-1">
                        <p className="text-dark-400 text-sm">
                            © {currentYear} {hasHydrated ? settings?.site_name : ''}. {t('footer.rights')}
                        </p>
                        <span className="hidden md:inline text-dark-700 mx-2">·</span>
                        <p className="text-dark-500 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary-600" />
                            Hecho en Ecuador 🇪🇨 · Prohibida la reproducción no autorizada.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-dark-500">{t('footer.secure_payments')}</span>
                        {/* Visa */}
                        <svg viewBox="0 0 38 24" className="h-6 w-auto opacity-60" xmlns="http://www.w3.org/2000/svg">
                            <rect width="38" height="24" rx="4" fill="#1A1F71"/>
                            <text x="19" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontFamily="Arial" fontWeight="bold" fontStyle="italic">VISA</text>
                        </svg>
                        {/* Mastercard */}
                        <svg viewBox="0 0 38 24" className="h-6 w-auto opacity-60" xmlns="http://www.w3.org/2000/svg">
                            <rect width="38" height="24" rx="4" fill="#252525"/>
                            <circle cx="15" cy="12" r="7" fill="#EB001B"/>
                            <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
                            <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00"/>
                        </svg>
                        {/* PayPal text badge */}
                        <span className="px-2 py-1 bg-dark-800 rounded text-[10px] font-black text-[#009cde] tracking-wider border border-dark-700">
                            PayPal
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
