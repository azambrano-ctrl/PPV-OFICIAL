'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Newspaper, ChevronRight } from 'lucide-react';
import { newsAPI } from '@/lib/api';
import { formatDate, getImageUrl } from '@/lib/utils';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/Footer';

interface NewsPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    thumbnail_url: string;
    created_at: string;
    is_featured: boolean;
    source_name?: string;
    source_url?: string;
}

export default function NewsPage() {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = ['All', 'UFC', 'TFL', 'Arena FP', 'Resultados'];

    useEffect(() => {
        loadPosts();
    }, [selectedCategory]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const params: any = { status: 'published' };
            if (selectedCategory !== 'All') {
                params.category = selectedCategory;
            }
            const res = await newsAPI.getAll(params);
            setPosts(res.data.data);
        } catch (error) {
            console.error('Error loading news:', error);
        } finally {
            setLoading(false);
        }
    };

    const featuredPost = posts.find(p => p.is_featured);
    const regularPosts = posts.filter(p => !featuredPost || p.id !== featuredPost.id);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />

            {/* Header Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-transparent" />

                <div className="container-custom relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-0.5 bg-red-600" />
                        <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter">
                            Noticias <span className="text-red-600">ARENA FP</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl uppercase tracking-wide font-medium">
                        Tu fuente principal de MMA en Ecuador y el mundo. Cobertura real, análisis técnico y exclusivas de Arena Fight Pass.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <main className="flex-grow container-custom pb-20">
                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-12 overflow-x-auto pb-4 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${selectedCategory === cat
                                ? 'bg-red-600 text-white'
                                : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
                                }`}
                        >
                            {cat === 'All' ? 'TODAS' : cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="spinner w-12 h-12" />
                    </div>
                ) : (
                    <>
                        {/* Featured Post */}
                        {featuredPost && selectedCategory === 'All' && (
                            <Link href={`/noticias/${featuredPost.slug}`} className="group mb-16 block">
                                <div className="relative h-[400px] md:h-[600px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                                    <Image
                                        src={getImageUrl(featuredPost.thumbnail_url || '') || ''}
                                        alt={featuredPost.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-4xl">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-tighter">
                                                DESTACADO
                                            </span>
                                            <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(featuredPost.created_at)}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 uppercase leading-tight">
                                            {featuredPost.title}
                                        </h2>
                                        <p className="text-gray-300 text-lg md:text-xl line-clamp-2 max-w-2xl mb-8 font-medium">
                                            {featuredPost.excerpt}
                                        </p>
                                        <div className="inline-flex items-center gap-2 text-red-500 font-black uppercase text-sm tracking-widest group-hover:translate-x-2 transition-transform">
                                            Leer Artículo Completo <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Recent News Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {regularPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/noticias/${post.slug}`}
                                    className="group flex flex-col bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden hover:border-red-600/50 transition-all shadow-xl"
                                >
                                    <div className="relative h-56 overflow-hidden">
                                        <Image
                                            src={getImageUrl(post.thumbnail_url || '') || ''}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex flex-wrap items-center gap-4 mb-4 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(post.created_at)}
                                            </div>
                                            {post.source_name && (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <Newspaper className="w-3 h-3" />
                                                    {post.source_name}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold mb-4 uppercase leading-tight group-hover:text-red-500 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-grow">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center gap-2 text-white font-black uppercase text-[11px] tracking-widest group-hover:gap-4 transition-all">
                                            Ver más <ChevronRight className="w-4 h-4 text-red-600" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {posts.length === 0 && !loading && (
                            <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-2xl">
                                <Newspaper className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                                <h3 className="text-xl font-bold mb-2">No se encontraron noticias</h3>
                                <p className="text-gray-500">Intenta filtrando por otra categoría o vuelve más tarde.</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
