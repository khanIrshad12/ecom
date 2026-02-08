import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readdir } from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ALLOWED_SUBDIRS = ["images", "uploads"];
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

function hasImageExt(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return IMAGE_EXT.has(ext);
}

/** Recursively collect image paths under dir, with path relative to public (e.g. "images/Men/foo.jpg"). Max depth 3. */
async function listImagesInDir(
  dirPath: string,
  relativePrefix: string,
  depth: number
): Promise<string[]> {
  if (depth > 3) return [];
  const out: string[] = [];
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const e of entries) {
      const rel = relativePrefix ? `${relativePrefix}/${e.name}` : e.name;
      if (e.isDirectory()) {
        const sub = await listImagesInDir(path.join(dirPath, e.name), rel, depth + 1);
        out.push(...sub);
      } else if (e.isFile() && hasImageExt(e.name)) {
        out.push(`/${rel}`);
      }
    }
  } catch {
    // ignore missing or unreadable dirs
  }
  return out;
}

/** Admin only: returns list of image paths under public/images and public/uploads. */
export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paths: string[] = [];
    for (const subdir of ALLOWED_SUBDIRS) {
      const dirPath = path.join(PUBLIC_DIR, subdir);
      const list = await listImagesInDir(dirPath, subdir, 1);
      paths.push(...list);
    }
    paths.sort();

    return NextResponse.json({ paths });
  } catch (error) {
    console.error("Public images GET error:", error);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}
