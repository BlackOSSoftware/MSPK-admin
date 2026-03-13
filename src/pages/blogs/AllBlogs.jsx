import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchBlogs, deleteBlog } from '../../api/blogs.api';
import TablePageToolbar from '../../components/ui/TablePageToolbar';
import TablePageFooter from '../../components/ui/TablePageFooter';
import BlogTable from '../../components/tables/BlogTable';
import Button from '../../components/ui/Button';

const AllBlogs = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const loadBlogs = async () => {
        setIsLoading(true);
        try {
            const response = await fetchBlogs({ page, limit });
            const { results, totalPages: pages } = response.data;
            setBlogs(results || []);
            setTotalPages(pages || 1);
        } catch (error) {
            console.error('Failed to fetch blogs:', error);
            toast.error('Failed to load blogs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBlogs();
    }, [page, limit]);

    const filteredBlogs = useMemo(() => {
        if (!searchTerm) return blogs;
        const term = searchTerm.toLowerCase();
        return blogs.filter((item) =>
            item.title?.toLowerCase().includes(term) || item.slug?.toLowerCase().includes(term)
        );
    }, [blogs, searchTerm]);

    const handleAction = async (action, item) => {
        if (action === 'edit') {
            navigate(`/blogs/edit/${item._id}`);
            return;
        }
        if (action === 'view') {
            navigate(`/blogs/edit/${item._id}`);
            return;
        }
        if (action === 'delete') {
            if (!window.confirm('Delete this blog?')) return;
            try {
                await deleteBlog(item._id);
                toast.success('Blog deleted');
                loadBlogs();
            } catch (error) {
                console.error('Failed to delete blog:', error);
                toast.error('Failed to delete blog');
            }
        }
    };

    return (
        <div className="p-4 space-y-4">
            <TablePageToolbar
                title="Blogs"
                subtitle="Content"
                icon={FileText}
                left={(
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-72">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search blogs..."
                                className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                )}
                right={(
                    <Button
                        onClick={() => navigate('/blogs/create')}
                        className="h-9 px-4 rounded-xl text-xs gap-2"
                    >
                        <Plus size={14} />
                        New Blog
                    </Button>
                )}
            />

            <BlogTable
                blogs={filteredBlogs}
                isLoading={isLoading}
                onAction={handleAction}
            />

            <TablePageFooter
                page={page}
                totalPages={totalPages}
                perPage={limit}
                perPageOptions={[10, 20, 50]}
                onPerPageChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                }}
                onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
                onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            />
        </div>
    );
};

export default AllBlogs;
