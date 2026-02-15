
// Initialize Supabase
const supabaseUrl = 'https://hzbmsntdjzalfqzugyln.supabase.co';
const supabaseKey = 'sb_publishable_fJTyFqxh_5_iXmYJ5pohhA_Y1eNc174';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Product info
const productName = "Flying Car in Space";

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

async function saveInquiry(inquiryData) {
    try {
        const { data, error } = await supabaseClient
            .from('inquiries')
            .insert([
                {
                    name: inquiryData.name,
                    email: inquiryData.email,
                    phone: inquiryData.phone,
                    message: inquiryData.message,
                    created_at: new Date().toISOString()
                },
            ]);

        if (error) {
            console.error('Error saving inquiry:', error);
            return { success: false, error };
        } else {
            console.log('Inquiry saved to Supabase:', data);
            // If data is returned, we can see the columns
            if (data && data.length > 0) {
                console.log('Stored columns:', Object.keys(data[0]));
            }
            return { success: true, data };
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        return { success: false, error: err.message };
    }
}
