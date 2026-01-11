# Transaction Pages - Frontend

## Files in this Directory

### Main Pages
- **billdesk_payment.html** - Main payment gateway page with multiple payment options
- **upi_processing.html** - UPI payment processing and confirmation page
- **payment_success.html** - Payment success confirmation page
- **student_profile.html** - Student profile display page

### Scripts & Tools
- **validate_javascript.ps1** - JavaScript validation tool
- **login_handler.js** - Login handling logic
- **students_db.js** - Student database management

### Documentation
- **JAVASCRIPT_GUIDELINES.md** - JavaScript coding guidelines and best practices

---

## 🚀 Quick Start

### Before Making Changes
Always run the validation script:
```powershell
.\validate_javascript.ps1
```

### After Making Changes
1. Run validation script again
2. Test in browser (open DevTools with F12)
3. Check for console errors
4. Test all payment methods

---

## ✅ Validation Script

The validation script checks for:
- Balanced braces in JavaScript code
- Properly closed script tags
- Common syntax errors

**Always run before committing:**
```powershell
.\validate_javascript.ps1
```

---

## 🐛 Common Issues Fixed

### Issue: "showSection is not defined"
✅ **Fixed** - Function now properly defined with event parameter

### Issue: "Unexpected token '}'"
✅ **Fixed** - Removed extra closing braces

### Issue: "event is not defined"
✅ **Fixed** - All functions now properly accept event parameter

---

## 📋 Testing Checklist

Before committing changes to any HTML file:

- [ ] Run `validate_javascript.ps1`
- [ ] Open page in browser
- [ ] Open DevTools (F12) and check Console
- [ ] Test Credit/Debit Card section
- [ ] Test Net Banking section
- [ ] Test UPI section
- [ ] Test BHIM section
- [ ] Test UPI QR section
- [ ] Verify no console errors
- [ ] Test on mobile view

---

## 🔧 How to Test

1. **Start the server:**
   ```powershell
   cd ../server
   npm start
   ```

2. **Open in browser:**
   - Main payment page: http://localhost:3000/transact/billdesk_payment.html
   - With student data: http://localhost:3000/transact/billdesk_payment.html?roll=123&name=John&course=MBA

3. **Check DevTools:**
   - Press F12
   - Go to Console tab
   - Look for any red errors

---

## 📝 Code Guidelines

### When modifying JavaScript:

1. **Always declare event parameter if using it:**
   ```javascript
   function myFunction(param, event) {  // ✅ Correct
       event.preventDefault();
   }
   ```

2. **Always pass event in onclick handlers:**
   ```html
   <div onclick="myFunction('value', event)">  <!-- ✅ Correct -->
   ```

3. **Check brace matching:**
   - Use editor with brace matching
   - Run validation script
   - Count opening and closing braces

4. **Test immediately:**
   - Don't accumulate untested changes
   - Test after every function modification

---

## 🆘 Need Help?

See these files:
- `JAVASCRIPT_GUIDELINES.md` - Detailed guidelines
- `../PRE_COMMIT_CHECKLIST.md` - Commit checklist
- `../QUICK_REFERENCE.md` - Quick reference

---

## 📊 File Status

| File | Status | Last Fixed |
|------|--------|------------|
| billdesk_payment.html | ✅ Working | 2025-12-23 |
| upi_processing.html | ✅ Working | 2025-12-23 |
| payment_success.html | ✅ Working | - |
| student_profile.html | ✅ Working | - |

---

**Maintained by:** Development Team  
**Last Updated:** December 23, 2025
