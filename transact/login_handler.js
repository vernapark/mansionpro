// Login validation and student lookup
// This file contains the logic to validate roll number and password

// Read student data from external file
function validateLogin() {
    console.log('validateLogin() called');
    
    const form = document.forms['f1'];
    const rollNo = form.login.value.trim().toUpperCase();
    const password = form.pass.value.trim().toUpperCase();
    
    console.log('Roll No:', rollNo);
    console.log('Password:', password);
    
    // Check if fields are empty
    if (!rollNo || !password) {
        alert('Please enter both Roll Number and Password');
        return false;
    }
    
    // Password must match Roll Number
    if (rollNo !== password) {
        alert('Invalid Roll Number or Password');
        form.login.value = '';
        form.pass.value = '';
        return false;
    }
    
    // Look up student in database
    console.log('Looking up student:', rollNo);
    const student = findStudent(rollNo);
    console.log('Student found:', student);
    
    if (student) {
        // Redirect to profile page with student data
        const params = new URLSearchParams({
            roll: student.rollNo,
            name: student.name,
            father: student.fatherName
        });
        const url = 'student_profile.html?' + params.toString();
        console.log('Redirecting to:', url);
        window.location.href = url;
        return false; // Prevent form submission
    } else {
        alert('Invalid Roll Number or Password');
        form.login.value = '';
        form.pass.value = '';
        return false;
    }
}

// Find student by roll number
function findStudent(rollNo) {
    // This will be populated with actual data
    const students = loadStudentData();
    return students[rollNo] || null;
}

// Load student data (will be generated from database)
function loadStudentData() {
    if (typeof STUDENTS_DB === 'undefined') {
        console.error('STUDENTS_DB is not loaded!');
        return {};
    }
    return STUDENTS_DB;
}
