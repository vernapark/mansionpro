// Student Database Lookup Module
const fs = require('fs');
const path = require('path');

let studentDatabase = null;
let lastDatabaseLoad = null;

function loadStudentDatabase(logger, __dirname) {
    try {
        const dbPath = path.join(__dirname, '../database students/database.txt');
        const content = fs.readFileSync(dbPath, 'utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        
        const students = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(/\s+/);
            let rollNumber = '', mobile = '', email = '';
            let rollIndex = -1, mobileIndex = -1;
            
            for (let j = 0; j < parts.length; j++) {
                if (parts[j].match(/^MBA\d{7}$/)) { rollNumber = parts[j]; rollIndex = j; break; }
            }
            for (let j = 0; j < parts.length; j++) {
                if (parts[j].match(/^\d{10}$/)) { mobile = parts[j]; mobileIndex = j; break; }
            }
            for (let j = 0; j < parts.length; j++) {
                if (parts[j].includes('@')) { email = parts[j]; break; }
            }
            
            if (rollNumber && mobile && email && rollIndex > 0 && mobileIndex > rollIndex) {
                const nameParts = parts.slice(rollIndex + 1, mobileIndex);
                const mid = Math.ceil(nameParts.length / 2);
                students.push({
                    rollNumber, 
                    name: nameParts.slice(0, mid).join(' '),
                    fatherName: nameParts.slice(mid).join(' '),
                    mobile, 
                    email
                });
            }
        }
        
        studentDatabase = students;
        lastDatabaseLoad = new Date().toISOString();
        logger.info('Student database loaded', { count: students.length });
        console.log(`✅ Loaded ${students.length} students`);
        return students;
    } catch (error) {
        logger.error('Error loading student database:', error);
        return [];
    }
}

function setupStudentAPI(app, logger, __dirname) {
    loadStudentDatabase(logger, __dirname);
    
    app.get('/api/student/:rollNumber', (req, res) => {
        try {
            const { rollNumber } = req.params;
            if (!studentDatabase || (Date.now() - new Date(lastDatabaseLoad).getTime()) > 300000) {
                loadStudentDatabase(logger, __dirname);
            }
            const student = studentDatabase.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
            if (student) {
                res.json({ success: true, student: { ...student, course: 'MBA', semester: '2' } });
                logger.info('Student found', { rollNumber });
            } else {
                res.status(404).json({ success: false, error: 'Student not found', rollNumber });
                logger.warn('Student not found', { rollNumber });
            }
        } catch (error) {
            logger.error('Error fetching student:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch student details' });
        }
    });
}

module.exports = { setupStudentAPI };
