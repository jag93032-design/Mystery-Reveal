
// Initialize Supabase
const supabaseUrl = 'https://hzbmsntdjzalfqzugyln.supabase.co';
const supabaseKey = 'sb_publishable_fJTyFqxh_5_iXmYJ5pohhA_Y1eNc174';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Product info
const productName = "Ultra Vision X1";

async function saveRevealResult() {
    try {
        const { data, error } = await supabaseClient
            .from('scratch_results')
            .insert([
                { product: productName, revealed_at: new Date().toISOString() },
            ]);

        if (error) {
            console.error('Error saving result:', error);
        } else {
            console.log('Result saved to Supabase:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}
