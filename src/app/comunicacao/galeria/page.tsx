import { createClient } from '@/lib/supabase/server'; // Correct import for server
import GalleryClientPage from './GalleryClientPage';

export default async function GalleryPage() {
    const supabase = await createClient();

    // Fetch all posts ordered by creation
    const { data: posts } = await supabase
        .from('communication_posts')
        .select('*')
        .order('created_at', { ascending: false });

    return <GalleryClientPage initialPosts={posts || []} />;
}
