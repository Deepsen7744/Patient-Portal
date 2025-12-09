const sqlite3 = require('sqlite3').verbose();


const db = new sqlite3.Database('./documents.db');

console.log('Initializing database...');


db.serialize(() => {
   
    db.run('DROP TABLE IF EXISTS documents', (err) => {
        if (err) {
            console.error('Error dropping table:', err.message);
        } else {
            console.log('Dropped existing documents table');
        }
    });

   
    db.run(`CREATE TABLE documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        filesize INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Documents table created successfully');
        }
    });
});


db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database initialization completed.');
        console.log('You can now start the server with: npm start');
    }
});
