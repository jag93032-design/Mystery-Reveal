
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hzbmsntdjzalfqzugyln.supabase.co';
const supabaseKey = 'sb_publishable_fJTyFqxh_5_iXmYJ5pohhA_Y1eNc174';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('--- Supabase Table Definition Check ---');

    // 1. Try to fetch one row from 'inquiries' to see if it exists and what columns it has
    const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .limit(1);

    if (error) {
        if (error.code === '42P01') {
            console.error('❌ Error: The table "inquiries" does not exist.');
        } else {
            console.error('❌ Error fetching from "inquiries":', error.message);
        }
    } else {
        console.log('✅ Table "inquiries" exists.');
        console.log('Current data count (max 1):', data.length);

        // Try to insert a test record to verify full connectivity and RLS
        console.log('\n--- Testing Insertion ---');
        const testData = {
            name: 'Test Connectivity',
            email: 'test@example.com',
            phone: '010-0000-0000',
            message: 'Testing table connection from script.'
        };

        const { error: insertError } = await supabase
            .from('inquiries')
            .insert([testData]);

        if (insertError) {
            console.error('❌ Insert failed:', insertError.message);
            console.log('Hint: Check if RLS (Row Level Security) is enabled and has an "Insert" policy for anon/authenticated roles.');
        } else {
            console.log('✅ Insert successful! Connectivity is perfect.');
        }
    }
}

checkTable();
