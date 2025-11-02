# Poppler Setup for Windows

## Quick Setup

PDF-poppler requires Poppler utilities to be installed on your system to convert PDFs to images for OCR.

### Option 1: Download Poppler for Windows (Recommended)

1. **Download Poppler**:
   - Go to: https://github.com/oschwartz10612/poppler-windows/releases/
   - Download the latest release (e.g., `Release-24.08.0-0.zip`)

2. **Extract Files**:
   - Extract the ZIP file to a location like: `C:\poppler`
   - After extraction, you should have: `C:\poppler\Library\bin\`

3. **Add to PATH**:
   - Open "Environment Variables" (Search in Windows Start)
   - Under "System Variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\poppler\Library\bin`
   - Click "OK" on all windows

4. **Verify Installation**:
   ```bash
   # Open new Command Prompt or PowerShell
   pdftoppm -v
   ```
   Should show version info if installed correctly

5. **Restart Server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### Option 2: Use Chocolatey (If you have Chocolatey installed)

```bash
choco install poppler
```

### Option 3: Skip PDF Conversion (Temporary)

If you can't install Poppler right now, you can:
- Use text-based PDFs only (they extract text directly without conversion)
- Upload images instead of PDFs (JPEG, PNG work without Poppler)

## Testing

After installation:

1. Restart your terminal/PowerShell
2. Run: `pdftoppm -v`
3. Should show: `pdftoppm version ...`
4. Restart server: `npm run dev`
5. Try uploading a PDF

## Troubleshooting

### "pdftoppm not found"
- Make sure you added the correct path to environment variables
- Restart your terminal/IDE completely
- Verify the path exists: `C:\poppler\Library\bin\pdftoppm.exe`

### Still Not Working?
- Check the bin folder has `.exe` files
- Try absolute path in code
- Use images instead of PDFs temporarily

## Alternative: Use Images Instead

If Poppler setup is problematic, you can:
1. Convert your PDFs to images first (use online tools or Adobe)
2. Upload the images (JPEG/PNG)
3. Works without any additional setup!

---

**After Poppler is installed, PDF OCR will work perfectly! 🎉**
