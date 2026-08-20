
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Helper to save uploaded file
async function saveFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filename = `${Date.now()}-${originalName}`;
    const uploadDir = path.join(process.cwd(), "public", "temp_uploads");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);
    return filepath;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const savedPath = await saveFile(file);
        console.log("PDF Saved to:", savedPath);

        const isWin = process.platform === 'win32';
        const winVenv = path.join(process.cwd(), "ocr_venv", "Scripts", "python.exe");
        const linVenv = "/var/www/voteraction/ocr_venv/bin/python";
        const scriptPath = path.join(process.cwd(), "scripts", "box_parser.py");

        let pythonCmd = isWin ? "python" : "python3";
        if (fs.existsSync(winVenv)) pythonCmd = winVenv;
        else if (fs.existsSync(linVenv)) pythonCmd = linVenv;

        return new Promise((resolve, reject) => {
            const cmd = `${pythonCmd} "${scriptPath}" "${savedPath}"`;
            console.log("Executing:", cmd);

            exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
                // Cleanup
                // fs.unlinkSync(savedPath); 

                if (error) {
                    console.error("Exec error:", stderr);
                    resolve(NextResponse.json({ error: "Parser failed", details: stderr }, { status: 500 }));
                } else {
                    try {
                        // Find JSON in output
                        const jsonStart = stdout.indexOf('[');
                        const jsonEnd = stdout.lastIndexOf(']');

                        if (jsonStart === -1 || jsonEnd === -1) {
                            console.log("Raw Output:", stdout);
                            throw new Error("No JSON found in output");
                        }

                        const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
                        const voters = JSON.parse(jsonStr);

                        resolve(NextResponse.json(voters));
                    } catch (e) {
                        console.error("JSON Parse error:", e);
                        resolve(NextResponse.json({ error: "Invalid JSON output", raw: stdout }, { status: 500 }));
                    }
                }
            });
        });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
