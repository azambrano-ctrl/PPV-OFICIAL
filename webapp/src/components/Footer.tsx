"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';
import { useSettingsStore } from '@/lib/store';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { newsletterAPI, handleAPIError } from '@/lib/api';

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
        { icon: Twitter, href: 'https://twitter.com/arenafightpass', label: 'Twitter' },
        { icon: Instagram, href: 'https://instagram.com/arenafightpass', label: 'Instagram' },
        { icon: Youtube, href: 'https://youtube.com/@arenafightpass', label: 'YouTube' },
    ];

    return (
        <footer className="bg-dark-900 border-t border-dark-800">
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
                    <p className="text-dark-400 text-sm">
                        © {currentYear} {hasHydrated ? settings?.site_name : ''}. {t('footer.rights')}
                    </p>
                    <p className="text-dark-500 text-xs mt-1">
                        Todo el contenido es propiedad de sus respectivos dueños y promotores. Prohibida la reproducción no autorizada.
                    </p>

                    <div className="flex items-center gap-4 text-sm text-dark-400">
                        <span>{t('footer.secure_payments')}</span>

                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-dark-800 rounded text-xs font-semibold">
                                STRIPE
                            </span>
                            <span className="px-2 py-1 bg-dark-800 rounded text-xs font-semibold">
                                PAYPAL
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
