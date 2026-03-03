async function run() {
    try {
        const url = 'https://xxwzrqaiujydyppkulue.supabase.co/rest/v1/rooms?select=*';
        const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4d3pycWFpdWp5ZHlwcGt1bHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTIwMjIsImV4cCI6MjA4NjY2ODAyMn0.t5irH_9Fs5wft7IXNncVRCNlflSI-KLclbLwoVNjTOE';

        const res = await fetch(url, {
            headers: {
                'apikey': apikey,
                'Authorization': `Bearer ${apikey}`
            }
        });
        const data = await res.json();
        console.log('SUPABASE DIRECT FETCH:', data);
    } catch (e) {
        console.error(e);
    }
}
run();
