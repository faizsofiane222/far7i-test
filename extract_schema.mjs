import fs from 'fs';

try {
    const buffer = fs.readFileSync('schema_dump.sql');
    const content = buffer.toString('utf16le');

    // Find CREATE TABLE blog_articles
    const lines = content.split('\n');
    let output = [];
    let found = false;

    for (let line of lines) {
        if (line.includes('CREATE TABLE public.blog_articles')) {
            found = true;
        }
        if (found) {
            output.push(line);
            if (line.includes(');')) {
                break;
            }
        }
    }

    // Also look for RLS or other mentions if not found
    if (output.length === 0) {
        console.log("CREATE TABLE not found in dump. Looking for any blog_articles mention...");
        lines.forEach(line => {
            if (line.includes('blog_articles')) console.log(line);
        });
    } else {
        console.log("FOUND_SCHEMA:");
        console.log(output.join('\n'));
    }

} catch (e) {
    console.error(e);
}
